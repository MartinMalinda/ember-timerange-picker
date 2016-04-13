import Ember from 'ember';
import layout from '../templates/components/timerange-picker';
import ResizeMixin from 'ember-resize-mixin/main';
import RecognizerMixin from 'ember-gestures/mixins/recognizers';
import {offsetToMinutes,
				minutesToOffset, 
				timeToMinutes,
				minutesToTime,
				convertTimeToMinutes,
				convertMinutesToTime} from '../macros/convert';
import {sumOf, substractSecondFromFirst} from '../macros/math';

const { computed, on } = Ember;

function makeStepped(dependentKey){
		return computed(dependentKey,'stepper', function(){	
			let value = this.get(dependentKey);
			return Math.round(value / this.get('stepper')) * this.get('stepper');
		});
}

export default Ember.Component.extend(ResizeMixin, RecognizerMixin, {
	recognizers: 'pan',
	layout: layout,

	fromDragging: false,
	toDragging: false,
	
	toOffsetX: 0,
	fromOffsetX: 0,
	interval: 15,

	minTime: "00:00",
	maxTime: "24:00",


	width: 0,
	markerWidth: 28,

	activeMarker: null,

	containerClass: 'tp-container',

	shouldUpdateDistance: false,
	
	fromMinutes: offsetToMinutes('fromOffsetXStepped'),
	toMinutes: offsetToMinutes('toOffsetXStepped'),

	// Strings to be displayed in the component
	fromValue: minutesToTime('fromMinutes'),
	toValue: minutesToTime('toMinutes'),

	minDuration: computed.alias('interval'),
	minDistance: minutesToOffset('minDuration'),
	maxDistance: minutesToOffset('maxDuration'),

	minMinutes: timeToMinutes('minTime'),
	maxMinutes: timeToMinutes('maxTime'),

	currentMax: sumOf('maxDistance', 'fromOffsetXStepped'),
	currentMin: substractSecondFromFirst('toOffsetXStepped','maxDistance'),

	// amount of minutes between minTime to maxTime
	minutesInRange: substractSecondFromFirst('maxMinutes', 'minMinutes'),

	toOffsetXStepped: makeStepped('toOffsetX'),
	fromOffsetXStepped: makeStepped('fromOffsetX'),

	passiveMarker: computed('activeMarker', function(){
		let draggedMarker = this.get('activeMarker');

		if(draggedMarker === 'to') {
			return 'from';
		}
		if(draggedMarker === 'from'){
			return 'to';
		}
		return false;
	}),

	stepper: computed('width', 'interval', function(){
		return this.get('width') * this.get('interval') / this.get('minutesInRange');
	}),

	markerDistance: computed(function(){
		return Math.abs(this.get('toOffsetXStepped') - this.get('fromOffsetXStepped'));
	}),

	pickedDuration: computed('fromMinutes','toMinutes', function(){
		let minutes = this.get('toMinutes') - this.get('fromMinutes');
		return convertMinutesToTime(minutes); 
	}),

	convertMinutesToOffset(minutes){
		return Math.round((minutes) * this.get('width') / this.get('minutesInRange'));
	},

	convertOffsetToMinutes(offset){
		return Math.round(offset / this.get('width')* this.get('minutesInRange')) + this.get('minMinutes');
	},

	analyzeDOM(){
		Ember.run.schedule('afterRender', () => {
			
			let containerEl = this.$().find('.' + this.get('containerClass'));

			this.set('width', containerEl.width());
			this.set('positionLeft',containerEl.offset().left);
			
		});

	},

	initialMarkerPlacement(){
		Ember.run.schedule('afterRender', () => {
			var fromMinutes = convertTimeToMinutes(this.get('initFromValue'));
			var toMinutes = convertTimeToMinutes(this.get('initToValue')) ;

			this.set('fromOffsetX',this.convertMinutesToOffset(fromMinutes - this.get('minMinutes')));
			this.set('toOffsetX', this.convertMinutesToOffset(toMinutes - this.get('minMinutes')));
		});
						
	},

	stopTheDragging(){

		if(this.attrs.afterDrag){
			this.attrs.afterDrag(this.get('fromValue'), this.get('toValue'));
		}
		this.set('activeMarker', false);
		this.set('toDragging', false);
		this.set('fromDragging', false);

	},

	moveMarker(markerType, offset, sendAction = true){
		this.set(markerType+'OffsetX',offset);
		if(sendAction && this.attrs.onChange){
			this.attrs.onChange(this.get('fromValue'), this.get('toValue'));
		}
	},

	initAnalyzeDOM: on('didInsertElement', function(){
		this.analyzeDOM();
		this.initialMarkerPlacement();
	}),

	reAanalyzeDOM: on('resize', function(){
		this.analyzeDOM();
		this.initialMarkerPlacement();
		this.notifyPropertyChange('markerDistance');
		
	}),

	moveSynchronously(relativeX, activeMarker){

		let passiveMarker = this.get('passiveMarker');

		if(this.get('shouldUpdateDistance')){

			this.notifyPropertyChange('markerDistance');
			this.set('shouldUpdateDistance', false);
		}

		let distance = this.get('markerDistance');
		let offsetX2 = 0;

		// get offset of the second marker, add or substract distance from offsetX
		if(passiveMarker === 'to'){
			offsetX2 = relativeX + distance;
		} else {
			offsetX2 = relativeX - distance;
		}


		let didHitMax = offsetX2 > this.get('width');
		let	didHitMin = offsetX2 < 0;
		let isWithinRange = !didHitMax && !didHitMin;

		if(isWithinRange){

			this.moveMarker(activeMarker, relativeX, false);
			this.moveMarker(passiveMarker, offsetX2, false);
			this.set(passiveMarker+'Dragging', true);

		} else {

			if(didHitMax){
				// move marker as far right as possible
				this.moveMarker(passiveMarker, this.get('width'));
			}

			if(didHitMin){
				// move marker as far left as possible
				this.moveMarker(passiveMarker, 0);
			}
		}
	},

	mouseMove(event){
		this.move(event, event.clientX);
	},


	move(event, x){

		let activeMarker = this.get('activeMarker');


		if(activeMarker){

			let relativeX = x - this.get('positionLeft');

			let	overMax = relativeX > this.get('width');
			let	overMin = relativeX < 0;

			if(this.get('maxDuration') && !event.ctrlKey){

				overMax = overMax || relativeX > this.get('currentMax');
				overMin = overMin || relativeX < this.get('currentMin');
			}

			let isWithinRange = !overMax && !overMin;
			let isChronological = false;
			let passiveMarker = this.get('passiveMarker');
			var correction = 0;

			if(activeMarker === 'from'){
				isChronological = relativeX + this.get('minDistance') < this.get('toOffsetX');
				correction = this.get('minDistance')*(-1);
			} else {
				isChronological = relativeX - this.get('minDistance') > this.get('fromOffsetX');
				correction = this.get('minDistance');
			} 

			if(isWithinRange){

				if(event.ctrlKey){
					this.moveSynchronously(relativeX, activeMarker);
				} else {

					if(isChronological){

						this.moveMarker(activeMarker, relativeX);
						this.set('shouldUpdateDistance', true);

					} else {
						this.moveMarker(activeMarker, this.get(passiveMarker+'OffsetX') + correction);
					}
				}
			}

		}

	},

	touchMove(event){
		this.move(event, event.originalEvent.touches[0].clientX);
	},

	mouseUp(){
		this.stopTheDragging();
	},

	panUp(event){
		this.mouseUp(event);
	},

	mouseLeave(){
		this.stopTheDragging();
	},

	panCancel(event){
		this.mouseLeave(event);
	},

	panEnd(event){
		this.mouseLeave(event);
	},



	actions: {
		startDragging(type){
			this.set(type+'Dragging',true);
			this.set('activeMarker',type);
		},

		endDragging(type){
			this.set(type+'Dragging',false);
			this.set('activeMarker',false);

		}
	}
});
