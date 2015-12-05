import { moduleForComponent, test } from 'ember-qunit';
// import wait from 'ember-testing';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('timerange-picker', 'Integration | Component | timerange picker', {
  integration: true
});


var markerWidth = 28;

function dragMarkerRel(x, marker,container, ctrlKey = false){

  Ember.run(() => {

    var mousemove = $.Event('mousemove');
    var offsetLeft = marker.offset().left;
    var offsetTop = marker.offset().top;

    $.extend(mousemove, {
        clientX: offsetLeft + x,
        clientY: offsetTop,
        ctrlKey: ctrlKey
    });

    marker.trigger('mousedown');
    container.trigger(mousemove);
    container.trigger('mouseup');
    
  });
}

function dragMarkerAbs(percentageX, marker,container, ctrlKey = false){

  Ember.run(() => {

    var mousemove = $.Event('mousemove');
    var containerOffsetLeft = container.offset().left;
    // var markerOffsetLeft = marker.offset().left;
    var offsetTop = marker.offset().top;

    $.extend(mousemove, {
        clientX: containerOffsetLeft + percentageX * container.width(),
        clientY: offsetTop,
        ctrlKey: ctrlKey
    });

    marker.trigger('mousedown');
    container.trigger(mousemove);
    container.trigger('mouseup');
    
  });
}

function continuousDragAbs(percentageX, marker,container, ctrlKey = false){
    Ember.run(() => {

    var mousemove = $.Event('mousemove');
    var containerOffsetLeft = container.offset().left;
    // var markerOffsetLeft = marker.offset().left;
    var offsetTop = marker.offset().top;
    var iterateTo = percentageX * container.width();

    marker.trigger('mousedown');

    function move(){
       $.extend(mousemove, {
          clientX: containerOffsetLeft + i,
          clientY: offsetTop,
          ctrlKey: ctrlKey
      });

      container.trigger(mousemove);
    }

    for (var i = containerOffsetLeft; i <= iterateTo; i++){

     
    }
    container.trigger('mouseup');
  });
}

function getDistance (marker1, marker2){
  return Math.round(Math.abs(marker1.offset().left - marker2.offset().left));
}

var ctrlKeydown = $.Event("keydown");
ctrlKeydown.which = 17;

test('it renders', function(assert) {
  assert.expect(4);

  this.render(hbs`
    {{timerange-picker class="time-range-picker" containerClass="my-container" initFromValue="8:00" initToValue="18:00"}}
  `);

  assert.equal(this.$().text().trim(), '8:00 - 18:00', 'Times are displayed');
  assert.equal(this.$('.my-container').length, 1, 'There is 1 container present');
  assert.equal(this.$('.marker').length, 2, 'There are 2 markers present');
  assert.equal(this.$('.line').length, 1, 'There is 1 line present');
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

test('marker moves when dragged', function(assert){
  assert.expect(8);

  this.render(hbs`
    {{timerange-picker class="time-range-picker" initFromValue="0:00" initToValue="24:00"}} 
  `);

  var leftMarker = this.$('.marker:eq(0)');
  var rightMarker = this.$('.marker:eq(1)');
  var container = this.$('.tp-container:eq(0)');
  var offsetLeft = container.offset().left;
  var containerWidth = container.width();
  var maxX = containerWidth + offsetLeft - markerWidth/2;
  var minX = offsetLeft - markerWidth/2;

  dragMarkerRel(120, leftMarker, container);
  assert.equal(leftMarker.offset().left > offsetLeft + 50, true, 'leftMarker moves to the right when dragged');

  dragMarkerRel(-140, leftMarker, container);
  assert.equal(leftMarker.offset().left >= offsetLeft, true, 'leftMarker stays at position 0 when dragged out of container area');

  dragMarkerAbs(0.5, leftMarker, container);
  dragMarkerAbs(0.4, rightMarker, container);
  assert.equal(leftMarker.offset().left, rightMarker.offset().left, 'Markers collide at the same spot when being dragged over themselves');

  Ember.run(() => $(window).resize());
  assert.equal(leftMarker.offset().left, minX, 'Left Marker is reset to initial position after window resize');
  assert.equal(rightMarker.offset().left, maxX, 'Left Marker is reset to initial position window resize');

  dragMarkerAbs(0.4, leftMarker, container);
  dragMarkerAbs(0.6, rightMarker, container);
  var distanceBefore = getDistance(leftMarker, rightMarker);

  var offsetBefore = leftMarker.offset().left;
  dragMarkerRel(containerWidth/5, leftMarker,container, true);
  var offsetAfter = leftMarker.offset().left;
  var distanceAfter = getDistance(leftMarker, rightMarker);

  assert.equal(distanceBefore, distanceAfter, 'If ctrl is pressed, the distance stays the same during dragging');
  assert.notEqual(offsetBefore, offsetAfter, 'If ctrl is pressed, the markers actually moved during dragging');

  dragMarkerAbs(0.4, leftMarker, container);
  dragMarkerAbs(0.8, rightMarker, container);
  dragMarkerAbs(0.7, leftMarker,container, true);

  assert.equal(rightMarker.offset().left, maxX, 'If ctrl is pressed and markers move synchronously to the right, right one should stop at the right');

  dragMarkerAbs(0.2, leftMarker, container);
  dragMarkerAbs(0.5, rightMarker, container);
  continuousDragAbs(0.2,rightMarker,container, true);

  assert.equal(leftMarker.offset().left, minX, 'If ctrl is pressed and markers move synchronously to the left, left one should stop at the left');


});
