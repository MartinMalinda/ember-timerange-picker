import Ember from 'ember';
import ResizeMixin from 'ember-resize-mixin/main';

export default Ember.Component.extend(ResizeMixin, {
	fromDragging: false,
	toDragging: false,
	
	toOffsetX: 0,
	fromOffsetX: 0,
	interval: 15,

	stepper: Ember.computed('width', 'interval', function(){
		return this.get('width')*this.get('interval')/(60*24);
	}),
	width: 0,
	markerWidth: 28,


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

	fromValue: Ember.computed('width','fromOffsetXStepped', function(){
		var totalminutes = Math.round((this.get('fromOffsetXStepped'))/this.get('width')*60*24);
		return this.convertMinutesToTime(totalminutes);
		// return totalminutes;
	}),
	toValue: Ember.computed('width','toOffsetXStepped', function(){
		var totalminutes = Math.round((this.get('toOffsetXStepped'))/this.get('width')*60*24);
		// return totalminutes;
		return this.convertMinutesToTime(totalminutes);

	}),

	toOffsetXStepped: Ember.computed('toOffsetX','stepper', function(){
		return Math.round(this.get('toOffsetX')/this.get('stepper'))*this.get('stepper');
		// return this.get('toOffsetX');
	}),
	fromOffsetXStepped: Ember.computed('fromOffsetX','stepper', function(){
		return Math.round(this.get('fromOffsetX')/this.get('stepper'))*this.get('stepper');
		// return this.get('fromOffsetX');
	}),

	nowDragging: null,

	mouseMove(event){
		var nowDragging = this.get('nowDragging');
		if(nowDragging){
			this.set(nowDragging+'OffsetX', event.clientX - this.get('positionLeft') - this.get('markerWidth')/2);
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
	didInsertElement(){
	},

	analyzeDOM(){
		Ember.run.schedule('afterRender', () => {
			
			this.set('width', this.$().width());
			this.set('positionLeft',this.$().offset().left);
			
		});

	},
	initAnalyzeDOM: Ember.on('didInsertElement', function(){
		this.analyzeDOM();
		this.initialMarkerPlacement();
	}),
	reAanalyzeDOM: Ember.on('resize', function(){
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