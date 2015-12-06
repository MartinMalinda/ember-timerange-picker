import Ember from 'ember';

const { computed, on } = Ember;

export default Ember.Component.extend({

	classNameBindings: ['type','dragging:dragging'],
	classNames: ['marker'],
	attributeBindings: ['style','draggable'],

	draggable:false,
	dragging: false,
	offsetX: 0,

	style: computed('offsetX', function(){
			return Ember.String.htmlSafe(`transform:translateX(${this.get('offsetX') - this.get('width')/2}px) `);
	}),

	mouseDown(){
	
		this.set('dragging', true);
		this.attrs.startDragging(this.get('type'));
	},
	setWidth: on('didInsertElement', function(){
		this.set('width', this.$().outerWidth());
	})

});
