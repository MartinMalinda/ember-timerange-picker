import { moduleForComponent, test } from 'ember-qunit';
// import wait from 'ember-testing';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('timerange-picker', 'Integration | Component | timerange picker', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(1);

  this.render(hbs`
    {{timerange-picker class="time-range-picker" initFromValue="8:00" initToValue="18:00"}}
  `);

  assert.equal(this.$().text().trim(), '8:00 - 18:00');
});

test('marker has dragging class during dragging', function(assert) {
  assert.expect(4);

  this.render(hbs`
    {{timerange-picker class="time-range-picker" initFromValue="8:00" initToValue="18:00"}} 
  `);

  Ember.run(() => this.$('.marker:eq(0)').trigger('mousedown'));
  assert.ok($('.marker:eq(0)').hasClass('dragging'), 'Marker has class dragging after mousedown');
  Ember.run(() => this.$('.time-range-picker:eq(0)').trigger('mouseup'));
  assert.ok(!$('.marker:eq(0)').hasClass('dragging'), 'Marker has not dragging class after mouseup');
  Ember.run(() => this.$('.marker:eq(0)').trigger('mousedown'));
  assert.ok($('.marker:eq(0)').hasClass('dragging'), 'Marker has class dragging again');
  Ember.run(() => this.$('.time-range-picker:eq(0)').trigger('mouseleave'));
  assert.ok(!$('.marker:eq(0)').hasClass('dragging'), 'Marker has not dragging class after mouseleave');
});

test('marker moves if being dragged', function(assert){
  assert.expect(1);

  this.render(hbs`
    {{timerange-picker class="time-range-picker" initFromValue="0:00" initToValue="24:00"}} 
  `);

  var mmEvent = $.Event('mousemove');
  var marker = $('.marker:eq(0)');
  var picker = $('.time-range-picker:eq(0)');

  var offsetLeft = marker.offset().left;

  $.extend(mmEvent, {
      clientX: offsetLeft + 120,
      clientY: marker.offset().top
  });

  marker.trigger('mousedown');
  picker.trigger(mmEvent);
  picker.trigger('mouseup');

  assert.equal(marker.offset().left > offsetLeft + 100, true);
});