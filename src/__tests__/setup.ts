import nock from 'nock';

// 모든 테스트 후 nock 정리
afterEach(() => {
  nock.cleanAll();
});

// 테스트 환경에서 실제 HTTP 요청 방지
beforeAll(() => {
  nock.disableNetConnect();
});

afterAll(() => {
  nock.enableNetConnect();
});
