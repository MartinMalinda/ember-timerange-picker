import Ember from 'ember';
import layout from '../templates/components/timerange-picker';
import ResizeMixin from 'ember-resize-mixin/main';
import RecognizerMixin from 'ember-gestures/mixins/recognizers';

const { computed, on } = Ember;

export default Ember.Component.extend(ResizeMixin, RecognizerMixin, {
	recognizers: 'pan swipe',
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

	minMinutes: computed('minTime', function(){
		return this.convertTimeToMinutes(this.get('minTime'));
	}),
	maxMinutes: computed('maxTime','minMinutes', function(){
		return this.convertTimeToMinutes(this.get('maxTime'));
	}),
	minutesInRange: computed('minMinutes', 'maxMinutes', function(){
		return this.get('maxMinutes') - this.get('minMinutes');
	}), 

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
		return this.get('width')*this.get('interval') / this.get('minutesInRange');
	}),

	fromMinutes: computed('width','fromOffsetXStepped', function(){
		return this.convertOffsetToMinutes(this.get('fromOffsetXStepped'));
	}),

	fromValue: computed('fromMinutes', function(){
		return this.convertMinutesToTime(this.get('fromMinutes'));
	}),

	toMinutes: computed('width','toOffsetXStepped', function(){
		return this.convertOffsetToMinutes(this.get('toOffsetXStepped'));
	}),

	toValue: computed('toMinutes', function(){
		return this.convertMinutesToTime(this.get('toMinutes'));
	}),

	toOffsetXStepped: computed('toOffsetX','stepper', function(){
		return this.makeStepped(this.get('toOffsetX'));
	}),
	fromOffsetXStepped: computed('fromOffsetX','stepper', function(){
		return this.makeStepped(this.get('fromOffsetX'));
	}),

	currentMax: computed('maxDistance','fromOffsetXStepped', function(){
		return this.get('maxDistance') + this.get('fromOffsetXStepped');
	}),

	currentMin: computed('maxDistance', 'toOffsetXStepped', function(){
		return this.get('toOffsetXStepped') - this.get('maxDistance');
	}),

	markerDistance: computed(function(){
		return Math.abs(this.get('toOffsetXStepped') - this.get('fromOffsetXStepped'));
	}),

	pickedDuration: computed('fromMinutes','toMinutes', function(){
		let minutes = this.get('toMinutes') - this.get('fromMinutes');
		return this.convertMinutesToTime(minutes); 
	}),

	minDuration: computed.alias('interval'),

	minDistance: computed('minDuration','width', function(){
		return this.convertMinutesToOffset(this.get('minDuration'));
	}),

	maxDistance: computed('maxDuration', 'width', function(){
		return this.convertMinutesToOffset(this.get('maxDuration'));
	}),

	convertMinutesToOffset(minutes){
		return Math.round((minutes) * this.get('width') / this.get('minutesInRange'));
	},

	convertOffsetToMinutes(offset){
		return Math.round(offset / this.get('width')* this.get('minutesInRange')) + this.get('minMinutes');
	},

	convertTimeToMinutes(timeString){

		var minutes = parseInt(timeString.split(":")[1]);
		var hours = parseInt(timeString.split(":")[0]);

		return minutes + hours*60;
	},

	convertMinutesToTime(totalminutes){
		var hours = (Math.floor(totalminutes / 60)).toString();
		if(hours.length === 1){
			hours = "0"+hours;
		}
		var minutes = (totalminutes % 60).toString();
		if(minutes.length === 1){
			minutes = "0"+minutes;
		}
		
		return `${hours}:${minutes}`;
	},

	makeStepped(value){
		return Math.round(value / this.get('stepper')) * this.get('stepper');
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
			var fromMinutes = this.convertTimeToMinutes(this.get('initFromValue'));
			var toMinutes = this.convertTimeToMinutes(this.get('initToValue')) ;

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

		if(passiveMarker === 'to'){
			offsetX2 = relativeX + distance;
		} else {
			offsetX2 = relativeX - distance;
		}


		let hitMax = offsetX2 > this.get('width');
		let	hitMin = offsetX2 < 0;
		let isWithinRange = !hitMax && !hitMin;

		if(isWithinRange){

			this.moveMarker(activeMarker, relativeX, false);
			this.moveMarker(passiveMarker, offsetX2, false);
			this.set(passiveMarker+'Dragging', true);

		} else {

			if(hitMax){
				this.moveMarker(passiveMarker, this.get('width'));
			}

			if(hitMin){
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

			if(isWithinRange && event.ctrlKey){
				this.moveSynchronously(relativeX, activeMarker);

			} else if (isWithinRange){

				if(isChronological){

					this.moveMarker(activeMarker, relativeX);
					this.set('shouldUpdateDistance', true);

				} else {
					this.moveMarker(activeMarker, this.get(passiveMarker+'OffsetX') + correction);
				}
			} 
			

		}
	},

	swipe(event){
		console.log(event);
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
