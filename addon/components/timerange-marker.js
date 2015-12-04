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
			return Ember.String.htmlSafe(`transform:translateX(${this.get('offsetX') - this.get('markerWidth')/2}px) `);
	}),

	mouseDown(event){
		console.log('mouseDown');
		console.log(event);
		this.set('dragging', true);
		this.attrs.startDragging(this.get('type'));
	}
});
