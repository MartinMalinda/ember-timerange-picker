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

	nowDragging: null,

	containerClass: 'tp-container',

	shouldUpdateDistance: false,

	stepper: computed('width', 'interval', function(){
		return this.get('width')*this.get('interval')/(60*24);
	}),

	fromValue: computed('width','fromOffsetXStepped', function(){
		var totalminutes = Math.round((this.get('fromOffsetXStepped'))/this.get('width')*60*24);
		return this.convertMinutesToTime(totalminutes);
	}),

	toValue: computed('width','toOffsetXStepped', function(){
		var totalminutes = Math.round((this.get('toOffsetXStepped'))/this.get('width')*60*24);
		return this.convertMinutesToTime(totalminutes);

	}),

	toOffsetXStepped: computed('toOffsetX','stepper', function(){
		return Math.round(this.get('toOffsetX')/this.get('stepper'))*this.get('stepper');
	}),
	fromOffsetXStepped: computed('fromOffsetX','stepper', function(){
		return Math.round(this.get('fromOffsetX')/this.get('stepper'))*this.get('stepper');
	}),

	markerDistance: computed(function(){
		return Math.abs(this.get('toOffsetXStepped') -this.get('fromOffsetXStepped'));
	}),


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
			this.attrs.afterDrag(this.get('day'),'Start',this.get('fromValue'));
			this.attrs.afterDrag(this.get('day'),'End',this.get('toValue'));
		}
		this.set('nowDragging', false);
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

	moveSynchronously(relativeX, nowDragging, otherMarker){


		if(this.get('shouldUpdateDistance')){

			this.notifyPropertyChange('markerDistance');
			this.set('shouldUpdateDistance', false);
		}

		let distance = this.get('markerDistance');
		let offsetX2 = 0;

		if(otherMarker === 'to'){
			offsetX2 = relativeX + distance;
		} else {
			offsetX2 = relativeX - distance;
		}

		let hitMax = offsetX2 > this.get('width');
		let hitMin = offsetX2 < 0;
		let isWithinRange = !hitMax && !hitMin;

		if(isWithinRange){
			this.set(nowDragging+'OffsetX', relativeX);
			this.set(otherMarker+'OffsetX', offsetX2);
			this.set(otherMarker+'Dragging', true);

		} else {

			if(hitMax){
				this.set(otherMarker+'OffsetX', this.get('width'));
			}

			if(hitMin){
				this.set(otherMarker+'OffsetX',0);
			}
		}
	},


	mouseMove(event){

		let nowDragging = this.get('nowDragging');

		if(nowDragging){

			let relativeX = event.clientX - this.get('positionLeft');
			let hitMax = relativeX > this.get('width');
			let hitMin = relativeX < 0;
			let isWithinRange = !hitMax && !hitMin;
			let isChronological = false;
			let otherMarker = null;
			var correction = 0;

			if(nowDragging === 'from'){
				isChronological = relativeX + this.get('stepper') < this.get('toOffsetX');
				otherMarker = 'to';
				correction = - this.get('stepper');
			} else {
				isChronological = relativeX - this.get('stepper') > this.get('fromOffsetX');
				otherMarker = 'from';
				correction = this.get('stepper');
			} 
			
			if(isChronological){

				if(isWithinRange){


					if(event.ctrlKey){
						
						this.moveSynchronously(relativeX, nowDragging, otherMarker);						

					} else {
						this.set(nowDragging+'OffsetX', relativeX);
						this.set('shouldUpdateDistance', true);
					}
				}

			} else {
				if(!event.ctrlKey){
					this.set(nowDragging+'OffsetX', this.get(otherMarker+'OffsetX') + correction);
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
			this.set('nowDragging',type);
		},

		endDragging(type){
			this.set(type+'Dragging',false);
			this.set('nowDragging',false);

		}
	}
});
