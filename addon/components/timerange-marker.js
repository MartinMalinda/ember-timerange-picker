import Ember from 'ember';

const { computed } = Ember;

export default Ember.Component.extend({

	classNameBindings: ['type','dragging:dragging'],
	classNames: ['marker'],
	attributeBindings: ['style','draggable'],

	draggable:false,
	dragging: false,
	offsetX: 0,
	markerWidth: 28,

	style: computed('offsetX', function(){
		// if(this.get('dragging')){
			return Ember.String.htmlSafe(`transform:translateX(${this.get('offsetX') - this.get('markerWidth')/2}px) `);
		// }
	}),

	mouseDown(event){
		if(event.button === 0){
			console.log(event.ctrlKey);
			this.set('dragging', true);
			this.attrs.startDragging(this.get('type'));
		}	
	},
	

	mouseLeave(event){
		// this.set('dragging', false);
	},

	mouseUp(event){
		if(event.button === 0){
			// this.set('dragging', false);
		}
	}
});
