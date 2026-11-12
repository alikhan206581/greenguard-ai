import asyncio, io, json, os, tempfile, unittest
from pathlib import Path
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
import main

class BackendTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();main.DB=Path(self.temp.name)/'test.sqlite3'
        self.client=TestClient(main.app);self.client.__enter__()
    def tearDown(self):
        self.client.__exit__(None,None,None);self.temp.cleanup()
    def test_benchmarks_and_exports(self):
        self.assertEqual(self.client.get('/health').json()['status'],'ONLINE')
        for case in self.client.get('/api/v1/cases').json():
            r=self.client.post('/api/v1/verify',json={'case_id':case['case_id']});self.assertEqual(r.status_code,200,r.text)
            data=r.json();self.assertEqual(data['verdict'],case['expected_verdict'])
            self.assertAlmostEqual(data['calculations']['calculated_total_reduction_pct'],100/3 if 'incomplete' in case['case_id'] else 20,places=5)
            self.assertEqual(self.client.get('/api/v1/verify/'+data['audit_id']).json(),data)
            pdf=self.client.get('/api/v1/verify/'+data['audit_id']+'/export-pdf');self.assertTrue(pdf.content.startswith(b'%PDF'))
        self.assertEqual(len(self.client.get('/api/v1/history').json()),3)
    def test_upload_pdf_csv(self):
        raw=self.client.get('/api/v1/samples/case_1_supported.csv').content
        pdf=self.client.get('/api/v1/samples/case_1_supported.pdf').content
        response=self.client.post('/api/v1/verify',files={'report_pdf':('report.pdf',pdf,'application/pdf'),'meter_csv':('meter.csv',raw,'text/csv')},data={'llm_provider':'deterministic'})
        self.assertEqual(response.status_code,200,response.text)
        data=response.json();self.assertEqual(data['verdict'],main.SUPPORTED)
        self.assertEqual(data['calculations']['calculated_total_reduction_pct'],20)
        self.assertEqual(data['extracted_claim']['claimed_reduction_pct']['page_number'],1)
        self.assertTrue(data['extracted_claim']['claimed_reduction_pct']['quote_verified_in_pdf'])
    def test_invalid_csv(self):
        text,raw=main.fixture('case_1_supported');pdf=main.render_pdf('Report',text.splitlines())
        for bad in [raw+raw.splitlines()[1]+b'\n',raw.replace(b'1000,0,1000',b'-1,0,1000',1),b'month\n2024-01\n',raw.replace(b'1000,0,1000',b'NaN,0,1000',1)]:
            r=self.client.post('/api/v1/verify',files={'report_pdf':('r.pdf',pdf),'meter_csv':('r.csv',bad)})
            self.assertEqual(r.status_code,422,r.text);self.assertIsInstance(r.json()['detail'],str)
    def test_missing_claim_and_zero_baseline(self):
        text,raw=main.fixture('case_1_supported');fields=main.extract_labeled([text.replace('Claimed reduction percent: 20','No saving percentage provided')]);rows=main.meter_rows(raw)
        result=main.electricity(rows,fields);self.assertEqual(result['verdict'],main.INSUFFICIENT);self.assertIsNone(result['extracted_claim']['claimed_reduction_pct']['value'])
        for r in rows:
            if r['period']=='baseline':r.update(grid_kwh=main.Decimal(0),solar_kwh=main.Decimal(0),total_kwh=main.Decimal(0))
        result=main.electricity(rows,fields);self.assertIsNone(result['calculations']['calculated_total_reduction_pct']);self.assertEqual(result['verdict'],main.INSUFFICIENT)
    def test_source_mismatch_and_periods(self):
        text,raw=main.fixture('case_1_supported');rows=main.meter_rows(raw)
        for bad in [text.replace('Facility name: Demo facility','Facility name: Other'),text.replace('2024-01 to 2024-12','2023-01 to 2023-12')]:
            self.assertEqual(main.electricity(rows,main.extract_labeled([bad]))['verdict'],main.INSUFFICIENT)
    def test_query_and_errors(self):
        r=self.client.post('/api/v1/verify?case_id=case_1_supported&llm_provider=deterministic',json={});self.assertEqual(r.status_code,200)
        self.assertEqual(self.client.post('/api/v1/verify',json={'case_id':'bad'}).status_code,404)
        self.assertEqual(self.client.post('/api/v1/verify',json=[]).status_code,422)
        self.assertEqual(self.client.get('/api/v1/verify/none').status_code,404)
        self.assertEqual(self.client.post('/api/v1/verify',files={'report_pdf':('bad.pdf',b'notpdf'),'meter_csv':('x.csv',b'x')}).status_code,422)
    def test_solar_fixtures(self):
        expected=['NORMAL_OPERATION','REBOUND_OVERCONSUMPTION','TECHNICAL_FAULT_SUSPECTED']
        for case,status in zip(self.client.get('/api/v1/solar/cases').json(),expected):
            r=self.client.post('/api/v1/solar/verify',json={'solar_case_id':case['solar_case_id']});self.assertEqual(r.status_code,200,r.text)
            data=r.json();self.assertEqual(data['verdict_status'],status);self.assertTrue(data['synthetic']);self.assertIn('NOT NASA',data['reference_source'])
            self.assertEqual(len(data['weather_health_check']['monthly_solar_series']),12)
            self.assertTrue(self.client.get('/api/v1/solar/'+data['solar_audit_id']+'/export-pdf').content.startswith(b'%PDF'))
    def test_solar_upload_external_failure(self):
        _,raw=main.solar_fixture('solar_case_1_healthy')
        weather={f'2024-{m:02}':(5,30) for m in range(1,13)}
        with patch.object(main,'nasa_weather',AsyncMock(return_value=weather)):
            r=self.client.post('/api/v1/solar/verify',files={'solar_inverter_csv':('solar.csv',raw)},data={'city':'Karachi','region':'Sindh','installed_capacity_kw':'500'})
            self.assertEqual(r.status_code,200,r.text);self.assertFalse(r.json()['synthetic'])
        with patch.object(main,'nasa_weather',AsyncMock(side_effect=main.HTTPException(503,'NASA unavailable'))):
            r=self.client.post('/api/v1/solar/verify',files={'solar_inverter_csv':('solar.csv',raw)},data={'city':'Karachi','region':'Sindh','installed_capacity_kw':'500'})
            self.assertEqual(r.status_code,503)
    def test_fairness_and_robustness(self):
        f=self.client.get('/api/v1/fairness/audit').json();self.assertEqual(f['total_cases'],36);self.assertEqual(f['overall_fpr'],0);self.assertEqual(len(f['combined_slices']),12)
        self.assertGreater(f['by_region'][0]['ci_upper'],0)
        for p in (0,2,10):
            r=self.client.get('/api/v1/fairness/adversarial-audit',params={'perturbation_pct':p}).json()
            self.assertEqual(r['total_adversarial_trials'],8);self.assertEqual(r['defended_flip_count'],0)
            if p==0:self.assertEqual(r['unprotected_flip_count'],0)
        self.assertEqual(self.client.get('/api/v1/fairness/adversarial-audit?perturbation_pct=nan').status_code,422)
        self.assertIn('SYNTHETIC BENCHMARK',self.client.get('/api/v1/fairness/export-csv').text)
    def test_checksum(self):
        r=self.client.post('/api/v1/verify',json={'case_id':'case_1_supported'}).json()
        with main.sqlite3.connect(main.DB) as db:db.execute("UPDATE audits SET payload='{}'")
        self.assertEqual(self.client.get('/api/v1/verify/'+r['audit_id']).status_code,409)
    def test_provider_errors_and_fallback(self):
        with patch.object(main.httpx.AsyncClient,'post',AsyncMock(side_effect=main.httpx.ConnectError('offline'))):
            r=self.client.post('/api/v1/verify',json={'case_id':'case_1_supported','llm_provider':'auto'});self.assertEqual(r.status_code,200);self.assertEqual(r.json()['active_llm_mode'],'DETERMINISTIC_RAG_FALLBACK')
            self.assertEqual(self.client.post('/api/v1/verify',json={'case_id':'case_1_supported','llm_provider':'ollama'}).status_code,503)

if __name__=='__main__':unittest.main(verbosity=2)
