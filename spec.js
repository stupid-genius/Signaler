const { assert } = require('chai');
const { default: Logger } = require('log-ng');
const sinon = require('sinon');
const { Signaler, ComputedSignaler } = require('./Signaler');

const logger = new Logger('spec.js');

describe('Signaler', function(){
	before(function(){
		Logger.setLogLevel('debug');
	});
	it('should create a signaler', function(){
		const signaler = Signaler({value: 'hello'});
		assert.instanceOf(signaler, EventTarget);
		assert.instanceOf(signaler, Signaler);
		assert.isFunction(signaler.register);
	});
	it('should throw an error if value is not an object', function(){
		assert.throws(() => Signaler('hello'), Error);
	});
	it('should handle name collision for register function', function(){
		const signaler = Signaler({register: 'hello'});
		assert.isFunction(signaler._register);
	});
	it('should accept a register function', function(){
		const test = {value: 'hello'};
		const signaler = Signaler(test);
		const spy = sinon.spy();
		signaler.register(spy);
		signaler.value = 'world';
		assert(spy.calledOnce);
		assert(spy.calledWith(sinon.match({detail: {key: 'value', value: 'world', oldValue: 'hello'}})));
		assert.equal(test.value, 'world');
	});
});

describe('ComputedSignaler', function(){
	before(function(){
		Logger.setLogLevel('debug');
	});
	it('should create a computed signaler', function(){
		const signaler = Signaler({value: 'hello'});
		const compSignal = ComputedSignaler(() => signaler.value, signaler);
		assert.instanceOf(compSignal, EventTarget);
		assert.instanceOf(compSignal, ComputedSignaler);
		assert.isFunction(compSignal.register);
	});
	it('should throw an error if constructor args are invalid', function(){
		assert.throws(() => ComputedSignaler('hello'), Error);
		assert.throws(() => ComputedSignaler(() => 'hello'), Error);
		assert.throws(() => ComputedSignaler(() => 'hello', 'world'), Error);
	});
	it('should accept a register function', function(){
		const signaler = Signaler({value: 'hello'});
		const compSignal = ComputedSignaler(() => signaler.value, signaler);
		const spy = sinon.spy();
		compSignal.register(spy);
		signaler.value = 'world';
		assert(spy.calledOnce);
		assert(spy.calledWith(sinon.match({detail: {value: 'world'}})));
	});
});
