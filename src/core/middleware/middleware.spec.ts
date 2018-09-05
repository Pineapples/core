import 'reflect-metadata';
import {Container} from 'inversify';

import * as http from 'http';
import * as sinon from 'sinon';

import DefaultsHandler from './handlers/api/defaults.handler';
import EchoRequestHandler from './handlers/mock/echo.request.handler';
import Middleware from './middleware';
import MockRequestHandler from './handlers/mock/mock.request.handler';
import RecordResponseHandler from './handlers/mock/record.response.handler';
import UpdateMocksHandler from './handlers/api/update-mocks.handler';
import MocksState from '../state/mocks.state';
import SetVariableHandler from './handlers/api/set-variable.handler';
import InitHandler from './handlers/api/init.handler';
import GetMocksHandler from './handlers/api/get-mocks.handler';
import GetVariablesHandler from './handlers/api/get-variables.handler';
import DeleteVariableHandler from './handlers/api/delete-variable.handler';
import PassThroughsHandler from './handlers/api/pass-throughs.handler';
import {ApplicableHandler} from './handlers/handler';
import {HttpMethods} from './http';
import GetRecordingsHandler from './handlers/api/get-recordings.handler';
import GetRecordedResponseHandler from './handlers/api/get-recorded-response.handler';

describe('Middleware', () => {
    let applicableHandler: ApplicableHandler;
    let applicableHandlerHandleFn: sinon.SinonStub;
    let applicableHandlerIsApplicableFn: sinon.SinonStub;
    let container: Container;
    let defaultsHandler: sinon.SinonStubbedInstance<DefaultsHandler>;
    let deleteVariableHandler: sinon.SinonStubbedInstance<DeleteVariableHandler>;
    let echoRequestHandler: sinon.SinonStubbedInstance<EchoRequestHandler>;
    let getApimockIdFn: sinon.SinonStub;
    let getMatchingApplicableHandlerFn: sinon.SinonStub;
    let getMocksHandler: sinon.SinonStubbedInstance<GetMocksHandler>;
    let getVariablesHandler: sinon.SinonStubbedInstance<GetVariablesHandler>;
    let getRecordingsHandler: sinon.SinonStubbedInstance<GetRecordingsHandler>;
    let initHandler: sinon.SinonStubbedInstance<InitHandler>;
    let middleware: Middleware;
    let mockRequestHandler: sinon.SinonStubbedInstance<MockRequestHandler>;
    let mocksState: sinon.SinonStubbedInstance<MocksState>;
    let nextFn: sinon.SinonStub;
    let passThroughsHandler: sinon.SinonStubbedInstance<PassThroughsHandler>;
    let recordResponseHandler: sinon.SinonStubbedInstance<RecordResponseHandler>;
    let getRecordedResponseHandler: sinon.SinonStubbedInstance<GetRecordedResponseHandler>;
    let request: any;
    let requestOnFn: sinon.SinonStub;
    let response: any;
    let setVariableHandler: sinon.SinonStubbedInstance<SetVariableHandler>;
    let updateMocksHandler: sinon.SinonStubbedInstance<UpdateMocksHandler>;

    beforeAll(() => {
        container = new Container();
        mocksState = sinon.createStubInstance(MocksState);
        request = sinon.createStubInstance(http.IncomingMessage);
        requestOnFn = request.on as sinon.SinonStub;
        response = sinon.createStubInstance(http.ServerResponse);
        defaultsHandler = sinon.createStubInstance(DefaultsHandler);
        deleteVariableHandler = sinon.createStubInstance(DeleteVariableHandler);
        echoRequestHandler = sinon.createStubInstance(EchoRequestHandler);
        getMocksHandler = sinon.createStubInstance(GetMocksHandler);
        getVariablesHandler = sinon.createStubInstance(GetVariablesHandler);
        getRecordingsHandler = sinon.createStubInstance(GetRecordingsHandler);
        applicableHandlerHandleFn = sinon.stub();
        applicableHandlerIsApplicableFn = sinon.stub();
        applicableHandler = { handle: applicableHandlerHandleFn, isApplicable: applicableHandlerIsApplicableFn };
        initHandler = sinon.createStubInstance(InitHandler);
        mockRequestHandler = sinon.createStubInstance(MockRequestHandler);
        passThroughsHandler = sinon.createStubInstance(PassThroughsHandler);
        recordResponseHandler = sinon.createStubInstance(RecordResponseHandler);
        getRecordedResponseHandler = sinon.createStubInstance(GetRecordedResponseHandler);
        setVariableHandler = sinon.createStubInstance(SetVariableHandler);
        updateMocksHandler = sinon.createStubInstance(UpdateMocksHandler);

        container.bind('DefaultsHandler').toConstantValue(defaultsHandler);
        container.bind('DeleteVariableHandler').toConstantValue(deleteVariableHandler);
        container.bind('EchoRequestHandler').toConstantValue(echoRequestHandler);
        container.bind('GetMocksHandler').toConstantValue(getMocksHandler);
        container.bind('GetVariablesHandler').toConstantValue(getVariablesHandler);
        container.bind('GetRecordingsHandler').toConstantValue(getRecordingsHandler);
        container.bind('InitHandler').toConstantValue(initHandler);
        container.bind('MockRequestHandler').toConstantValue(mockRequestHandler);
        container.bind('MocksState').toConstantValue(mocksState);
        container.bind('PassThroughsHandler').toConstantValue(passThroughsHandler);
        container.bind('SetVariableHandler').toConstantValue(setVariableHandler);
        container.bind('RecordResponseHandler').toConstantValue(recordResponseHandler);
        container.bind('GetRecordedResponseHandler').toConstantValue(getRecordedResponseHandler);
        container.bind('UpdateMocksHandler').toConstantValue(updateMocksHandler);
        container.bind('Middleware').to(Middleware);
        nextFn = sinon.stub();

        middleware = container.get<Middleware>('Middleware');
        getApimockIdFn = sinon.stub(Middleware.prototype, 'getApimockId');
        getMatchingApplicableHandlerFn = sinon.stub(Middleware.prototype, 'getMatchingApplicableHandler');
    });

    describe('middleware', () => {
        describe('matching applicable handler', () => {
            beforeEach(() => {
                getApimockIdFn.returns('apimockId');
                getMatchingApplicableHandlerFn.returns(applicableHandler);
                request.headers = { 'some': 'header' };
                requestOnFn.onCall(0).returns(request);

                middleware.middleware(request, response, nextFn);

                requestOnFn.getCall(0).callArgWith(1, new Buffer('{"x":"x"}'));
                requestOnFn.getCall(1).callArgWith(1);
            });

            it('gets the apimock id', () =>
                sinon.assert.called(getApimockIdFn));

            it('gets the matching applicable handler', () =>
                sinon.assert.calledWith(getMatchingApplicableHandlerFn, request, { x: 'x' }));

            it('calls the handler.handle', () =>
                sinon.assert.calledWith(applicableHandlerHandleFn, request, response, nextFn, {
                    id: 'apimockId',
                    body: { x: 'x' }
                }));

            afterEach(() => {
                requestOnFn.reset();
                getApimockIdFn.reset();
                getMatchingApplicableHandlerFn.reset();
            });
        });

        describe('matching mock', () => {
            describe('always', () => {
                beforeEach(() => {
                    getApimockIdFn.returns('apimockId');
                    getMatchingApplicableHandlerFn.returns(undefined);
                    mocksState.getMatchingMock.returns({
                        name: 'matching-mock', isArray: true,
                        request: { url: '/base-url', method: HttpMethods.GET }, responses: {}
                    });
                    request.url = '/base-url';
                    request.method = HttpMethods.GET;
                    request.headers = { 'some': 'header' };
                    requestOnFn.onCall(0).returns(request);

                    middleware.middleware(request, response, nextFn);

                    requestOnFn.getCall(0).callArgWith(1, new Buffer('{"x":"x"}'));
                    requestOnFn.getCall(1).callArgWith(1);
                });

                it('gets the apimock id', () =>
                    sinon.assert.called(getApimockIdFn));

                it('gets the matching applicable handler', () =>
                    sinon.assert.calledWith(getMatchingApplicableHandlerFn, request, { x: 'x' }));

                it('gets the matching mock', () =>
                    sinon.assert.calledWith(mocksState.getMatchingMock, '/base-url', HttpMethods.GET, {
                        'some': 'header'
                    }, { x: 'x' }));

                it('calls the echo request handler', () =>
                    sinon.assert.calledWith(echoRequestHandler.handle, request, response, nextFn, {
                        id: 'apimockId',
                        mock: {
                            name: 'matching-mock', isArray: true,
                            request: { url: '/base-url', method: HttpMethods.GET }, responses: {}
                        },
                        body: { x: 'x' }
                    }));

                afterEach(() => {
                    requestOnFn.reset();
                    getApimockIdFn.reset();
                    getMatchingApplicableHandlerFn.reset();
                });
            });

            describe('recording is enabled', () => {
                beforeEach(() => {
                    mocksState.record = true;
                    getApimockIdFn.returns('apimockId');
                    getMatchingApplicableHandlerFn.returns(undefined);
                    mocksState.getMatchingMock.returns({
                        name: 'matching-mock', isArray: true,
                        request: { url: '/base-url', method: HttpMethods.GET }, responses: {}
                    });
                    request.url = '/base-url';
                    request.method = HttpMethods.GET;
                    request.headers = { 'some': 'header' };
                    requestOnFn.onCall(0).returns(request);
                });

                describe('record header is present', () => {
                    beforeEach(() => {
                        request.headers.record = 'true';
                        middleware.middleware(request, response, nextFn);

                        requestOnFn.getCall(0).callArgWith(1, new Buffer('{"x":"x"}'));
                        requestOnFn.getCall(1).callArgWith(1);
                    });

                    it('does not call the record response handler', () =>
                        sinon.assert.notCalled(recordResponseHandler.handle));
                });

                describe('record header is not present', () => {
                    beforeEach(() => {
                        request.headers.record = undefined;
                        middleware.middleware(request, response, nextFn);

                        requestOnFn.getCall(0).callArgWith(1, new Buffer('{"x":"x"}'));
                        requestOnFn.getCall(1).callArgWith(1);
                    });

                    it('calls the record response handler', () =>
                        sinon.assert.calledWith(recordResponseHandler.handle, request, response, nextFn, {
                            mock: {
                                name: 'matching-mock', isArray: true,
                                request: { url: '/base-url', method: HttpMethods.GET }, responses: {}
                            },
                            body: { x: 'x' }
                        }));

                });

                afterEach(() => {
                    requestOnFn.reset();
                    getApimockIdFn.reset();
                    getMatchingApplicableHandlerFn.reset();
                    recordResponseHandler.handle.reset();
                });
            });

            describe('recording is disabled', () => {
                beforeEach(() => {
                    mocksState.record = false;
                    getApimockIdFn.returns('apimockId');
                    getMatchingApplicableHandlerFn.returns(undefined);
                    mocksState.getMatchingMock.returns({
                        name: 'matching-mock', isArray: true,
                        request: { url: '/base-url', method: HttpMethods.GET }, responses: {}
                    });
                    request.url = '/base-url';
                    request.method = HttpMethods.GET;
                    request.headers = { 'some': 'header' };
                    requestOnFn.onCall(0).returns(request);

                    middleware.middleware(request, response, nextFn);

                    requestOnFn.getCall(0).callArgWith(1, new Buffer('{"x":"x"}'));
                    requestOnFn.getCall(1).callArgWith(1);
                });

                it('calls the mock request handler', () => sinon.assert.calledWith(mockRequestHandler.handle, request,
                    response, nextFn, {
                        id: 'apimockId',
                        mock: {
                            name: 'matching-mock', isArray: true,
                            request: { url: '/base-url', method: HttpMethods.GET }, responses: {}
                        }
                    }));

                afterEach(() => {
                    requestOnFn.reset();
                    getApimockIdFn.reset();
                    getMatchingApplicableHandlerFn.reset();
                    mockRequestHandler.handle.reset();
                });
            });
        });

        describe('no matching mock', () => {
            beforeEach(() => {
                getApimockIdFn.returns('apimockId');
                getMatchingApplicableHandlerFn.returns(undefined);
                mocksState.getMatchingMock.returns(undefined);
                requestOnFn.onCall(0).returns(request);
                request.headers = { 'some': 'header' };

                middleware.middleware(request, response, nextFn);

                requestOnFn.getCall(0).callArgWith(1, new Buffer('{"x":"x"}'));
                requestOnFn.getCall(1).callArgWith(1);
            });

            it('calls next', () => sinon.assert.called(nextFn));

            afterEach(() => {
                requestOnFn.reset();
                getApimockIdFn.reset();
                getMatchingApplicableHandlerFn.reset();
                nextFn.reset();
            });
        });
    });

    describe('getMatchingApplicableHandler', () => {
        beforeEach(() => {
            getMatchingApplicableHandlerFn.callThrough();
            getVariablesHandler.isApplicable.returns(true);
        });

        it('finds the applicable handler', () =>
            expect(middleware.getMatchingApplicableHandler(request, { x: 'x' })).toEqual(getVariablesHandler));

        afterEach(() => {
            getMatchingApplicableHandlerFn.reset();
            getVariablesHandler.isApplicable.reset();
        });
    });

    describe('getApimockId', () => {
        beforeEach(() => {
            getApimockIdFn.callThrough();
        });
        describe('apimockId cookie is present', () =>
            it('returns the apimockId', () =>
                expect(middleware.getApimockId({ cookie: 'a=a;apimockid=123;c=c' })).toBe('123')));

        describe('apimockId cookie is not present', () =>
            it('returns undefined', () =>
                expect(middleware.getApimockId({ cookie: 'a=a;b=b;c=c' })).toBe(undefined)));
    });
});