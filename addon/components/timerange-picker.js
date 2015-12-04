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

	initAnalyzeDOM: on('didInsertElement', function(){
		this.analyzeDOM();
		this.initialMarkerPlacement();
	}),

	reAanalyzeDOM: on('resize', function(){
		console.log('resizing');
		this.analyzeDOM();
		this.initialMarkerPlacement();
		
	}),

	initialMarkerPlacement(){
		Ember.run.schedule('afterRender', () => {
			var fromMinutes = this.convertTimeToMinutes(this.get('initFromValue'));
			var toMinutes = this.convertTimeToMinutes(this.get('initToValue'));

			console.log(fromMinutes,this.get('width'));
			this.set('fromOffsetX',fromMinutes/(60*24)*this.get('width'));
			this.set('toOffsetX',toMinutes/(60*24)*this.get('width'));
		});
						
	},

	mouseMove(event){

		let nowDragging = this.get('nowDragging');

		if(nowDragging){

			let relativeX = event.clientX - this.get('positionLeft');
			let isWithinRange = relativeX > 0 && relativeX < this.get('width');
			let isChronological = false;
			let otherMarker = null;

			if(nowDragging === 'from'){
				isChronological = relativeX < this.get('toOffsetX');
				otherMarker = 'to';
			} else {
				isChronological = relativeX > this.get('fromOffsetX');
				otherMarker = 'from';
			} 
			
			if(isChronological){

				if(isWithinRange){
					this.set(nowDragging+'OffsetX', relativeX);

					if(event.ctrlKey){
						if(this.get('shouldUpdateDistance')){

							this.notifyPropertyChange('markerDistance');
							this.set('shouldUpdateDistance', false);

						}
						let distance = this.get('markerDistance');

						this.set(otherMarker+'OffsetX', relativeX + distance);

					} else {
						this.set('shouldUpdateDistance', true);
					}
				}

			} else {
				this.set(nowDragging+'OffsetX', this.get(otherMarker+'OffsetX'));
			}

		}
	},

	mouseUp(){

		this.attrs.afterDrag(this.get('day'),'Start',this.get('fromValue'));
		this.attrs.afterDrag(this.get('day'),'End',this.get('toValue'));
		this.set('nowDragging', false);
	},

	mouseLeave(){

		this.attrs.afterDrag(this.get('day'),'Start',this.get('fromValue'));
		this.attrs.afterDrag(this.get('day'),'End',this.get('toValue'));
		this.set('nowDragging', false);
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
