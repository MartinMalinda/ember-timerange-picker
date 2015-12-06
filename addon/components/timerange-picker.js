import Ember from 'ember';
import layout from '../templates/components/timerange-picker';
import ResizeMixin from 'ember-resize-mixin/main';

const { computed, on } = Ember;

export default Ember.Component.extend(ResizeMixin, {

	layout: layout,

	fromDragging: false,
	toDragging: false,
	
	toOffsetX: 0,
	fromOffsetX: 0,
	interval: 15,

	width: 0,
	markerWidth: 28,

	activeMarker: null,

	containerClass: 'tp-container',

	shouldUpdateDistance: false,

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
		return this.get('width')*this.get('interval')/(60*24);
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

	markerDistance: computed(function(){
		return Math.abs(this.get('toOffsetXStepped') - this.get('fromOffsetXStepped'));
	}),

	pickedDuration: computed('fromMinutes','toMinutes', function(){
		let minutes = this.get('toMinutes') - this.get('fromMinutes');
		return this.convertMinutesToTime(minutes); 
	}),

	minDuration: computed(function(){
		return this.get('interval');
	}),

	minDistance: computed('minDuration','width', function(){
		return this.convertMinutesToOffset(this.get('minDuration'));
	}),

	convertMinutesToOffset(minutes){
		return Math.round(minutes * this.get('width') / (60*24));
	},

	convertOffsetToMinutes(offset){
		return Math.round(offset / this.get('width')*60*24);
	},

	convertTimeToMinutes(timeString){

		var minutes = parseInt(timeString.split(":")[1]);
		var hours = parseInt(timeString.split(":")[0]);

		return minutes + hours*60;
	},

	convertMinutesToTime(totalminutes){
		var hours = Math.floor(totalminutes / 60);
		if(hours === 0) {
			hours = "00";
		}
		var minutes = totalminutes % 60;
		if(minutes === 0){
			minutes = "00";
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
			var toMinutes = this.convertTimeToMinutes(this.get('initToValue'));

			this.set('fromOffsetX',fromMinutes/(60*24)*this.get('width'));
			this.set('toOffsetX',toMinutes/(60*24)*this.get('width'));
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
		let hitMin = offsetX2 < 0;
		let isWithinRange = !hitMax && !hitMin;

		if(isWithinRange){

			this.set(activeMarker+'OffsetX', relativeX);
			this.set(passiveMarker+'OffsetX', offsetX2);
			this.set(passiveMarker+'Dragging', true);

		} else {

			if(hitMax){
				this.set(passiveMarker+'OffsetX', this.get('width'));
			}

			if(hitMin){
				this.set(passiveMarker+'OffsetX',0);
			}
		}
	},


	mouseMove(event){

		let activeMarker = this.get('activeMarker');

		if(activeMarker){

			let relativeX = event.clientX - this.get('positionLeft');

			let overMax = relativeX > this.get('width');
			let overMin = relativeX < 0;

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

					this.set(activeMarker+'OffsetX', relativeX);
					this.set('shouldUpdateDistance', true);

				} else {

					this.set(activeMarker+'OffsetX', this.get(passiveMarker+'OffsetX') + correction);
					
				}
			} 
			

		}
	},

	mouseUp(){
		this.stopTheDragging();
	},

	mouseLeave(){
		this.stopTheDragging();
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
