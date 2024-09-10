export function Signaler(value){
	if(!new.target){
		return new Signaler(...arguments);
	}
	if(typeof value !== 'object'){
		throw new Error('Signaler value must be an object');
	}

	const eventTarget = new EventTarget();
	const proxy = new Proxy(value, {
		get(target, key){
			if(key === `${'register' in value ? '_' : ''}register`){
				// TODO return a de-register function
				return eventTarget.addEventListener.bind(eventTarget, 'change')
			}
			return Reflect.get(...arguments);
		},
		set(target, key, value){
			const oldValue = target[key];
			target[key] = value;
			eventTarget.dispatchEvent(new CustomEvent('change', {detail: {key, value, oldValue}}));
			return Reflect.set(...arguments);
		}
	});

	Object.setPrototypeOf(proxy, Signaler.prototype);
	return proxy;
}
Signaler.prototype = Object.create(EventTarget.prototype);
Signaler.prototype.constructor = Signaler;

export function ComputedSignaler(compFn, ...deps){
	if(!new.target){
		return new ComputedSignaler(...arguments);
	}
	if(typeof compFn !== 'function'){
		throw new Error('ComputedSignaler compFn must be a function');
	}
	if(deps.length === 0){
		throw new Error('ComputedSignaler requires at least one dependency');
	}
	if(deps.some(dep => !(dep instanceof Signaler))){
		throw new Error('All ComputedSignaler dependencies must be instances of Signaler');
	}

	const eventTarget = new EventTarget();
	function update(){
		const newVal = compFn();
		if(newVal !== update.value){
			update.value = newVal;
			eventTarget.dispatchEvent(new CustomEvent('change', {detail: {value: newVal}}));
		}
	}

	const signals = deps.map(dep => dep._register?.(update) ?? dep.register?.(update));
	Object.defineProperty(signals, 'register', {
		value: eventTarget.addEventListener.bind(eventTarget, 'change')
	});
	Object.setPrototypeOf(signals, ComputedSignaler.prototype);
	return signals;
}
ComputedSignaler.prototype = Object.create(Signaler.prototype);
ComputedSignaler.prototype.constructor = ComputedSignaler;
