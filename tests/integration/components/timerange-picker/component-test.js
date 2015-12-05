import { moduleForComponent, test } from 'ember-qunit';
// import wait from 'ember-testing';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('timerange-picker', 'Integration | Component | timerange picker', {
  integration: true
});


var markerWidth = 28;


var markerStruct = function($marker, location, $container, width){

  this.$m = $marker;
  this.location = location;
  this.$container = $container;
  this.width = width;

  this.ctrlKey = false;
  this.mousemove = $.Event('mousemove');

  this.offsetTop = this.$m.offset().top;

  this.previousOffset = 0;

  this.getX = function(){
    return this.$m.offset().left - this.$container.offset().left + this.width/2;
  }

  this.getOffset = function(){
    return Math.round(this.$m.offset().left);
  }

  this.moveRel = function(x){

    this.previousOffset = this.getOffset();

    Ember.run(() => {

      $.extend(this.mousemove, {
        clientX: this.getOffset() + x,
        clientY: this.offsetTop,
        ctrlKey: this.ctrlKey
      });

      this.drag();

    });
  }

  this.moveAbs = function(percentageX){
    var containerOffsetLeft = this.$container.offset().left;
    var containerWidth = this.$container.width();

    Ember.run(() => {
      $.extend(this.mousemove, {
        clientX: containerOffsetLeft + percentageX * this.$container.width(),
        clientY: this.offsetTop,
        ctrlKey: this.ctrlKey
      });

      this.drag();
    });
  }

  this.smoothDrag = function(percentageX){

    var currentPercentage = Math.round(this.getX()/this.$container.width()*100);
    var leftDirection = percentageX < currentPercentage;

    var i = currentPercentage;
    while( i !== percentageX * 100){
      this.moveAbs(i/100);
      if(leftDirection) {
        i--;
      } else {
        i++;
      }
    }

    if(i === percentageX * 100){
      var destinationX = Math.round(percentageX * this.$container.width());
      i = Math.round(this.getOffset());
      while(i !== destinationX){
        if(leftDirection){
          this.moveRel(-1);
          i--;
        } else {
          this.moveRel(1);
          i++;
        }
      }
    }
  }

  this.drag = function(){
    this.$m.trigger('mousedown');
    this.$container.trigger(this.mousemove);
    this.$container.trigger('mouseup');
  }
}

function getDistance (marker1, marker2){
  return Math.round(Math.abs(marker1.getOffset() - marker2.getOffset()));
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

  var marker = new markerStruct(this.$('.marker:eq(0)'), 'left', this.$('.time-range-picker:eq(0)'), 28);

  Ember.run(() => marker.$m.trigger('mousedown'));
  assert.ok(marker.$m.hasClass('dragging'), 'Marker has class dragging after mousedown');
  Ember.run(() => marker.$container.trigger('mouseup'));
  assert.ok(!marker.$m.hasClass('dragging'), 'Marker has not dragging class after mouseup');
  Ember.run(() => marker.$m.trigger('mousedown'));
  assert.ok(marker.$m.hasClass('dragging'), 'Marker has class dragging again after mousedown');
  Ember.run(() => marker.$container.trigger('mouseleave'));
  assert.ok(!marker.$m.hasClass('dragging'), 'Marker has not dragging class after mouseleave');
});

test('marker moves properly when dragged', function(assert){
  assert.expect(10);

  var interval = 15;

  this.render(hbs`
    {{timerange-picker class="time-range-picker" initFromValue="0:00" initToValue="24:00"}} 
  `);

  var leftMarker = new markerStruct(this.$('.marker:eq(0)'), 'left', this.$('.tp-container:eq(0)'), 28);
  var rightMarker = new markerStruct(this.$('.marker:eq(1)'), 'right', this.$('.tp-container:eq(0)'), 28);
  var $container = leftMarker.$container;

  var maxX = $container.width();
  var stepper = Math.round($container.width()*interval/(60*24));

  var offsetBefore = leftMarker.getOffset();
  leftMarker.moveRel(120);
  assert.ok(leftMarker.getOffset() > offsetBefore + 100, 'leftMarker moves to the right when dragged');

  leftMarker.moveRel(-240);
  assert.ok(leftMarker.getOffset() === leftMarker.previousOffset, 'leftMarker stays at position 0 when dragged out of container area');


  leftMarker.moveAbs(0.5);
  rightMarker.moveAbs(0.4);

  assert.equal(leftMarker.getOffset() + stepper, rightMarker.getOffset(), 'Markers collide at minimal distance when being dragged over themselves');


  Ember.run(() => $(window).resize());
  assert.equal(leftMarker.getX(), 0, 'Left Marker is reset to initial position after window resize');
  assert.equal(rightMarker.getX(), maxX, 'Right Marker is reset to initial position window resize');

  leftMarker.moveAbs(0.4);
  rightMarker.moveAbs(0.6);
  
  var distanceBefore = getDistance(leftMarker, rightMarker);
  leftMarker.ctrlKey = true;
  leftMarker.moveAbs(0.5);
  var distanceAfter = getDistance(leftMarker, rightMarker);

  assert.notEqual(leftMarker.previousOffset, leftMarker.getOffset(), 'If ctrl is pressed, the markers actually moved during dragging');
  assert.equal(distanceBefore, distanceAfter, 'If ctrl is pressed, the distance stays the same during dragging');

  leftMarker.ctrlKey = false;
  leftMarker.moveAbs(0.4);
  rightMarker.moveAbs(0.8);
  leftMarker.ctrlKey = true;
  leftMarker.moveAbs(0.7);

  assert.equal(rightMarker.getX(), maxX, 'If ctrl is pressed and markers move synchronously to the right, right one should get out of range');

  leftMarker.ctrlKey = false;
  leftMarker.moveAbs(0.2);
  rightMarker.moveAbs(0.6);
  distanceBefore = getDistance(leftMarker, rightMarker);
  rightMarker.ctrlKey = true;
  rightMarker.smoothDrag(0.1);
  distanceAfter = getDistance(leftMarker,rightMarker);

  assert.equal(leftMarker.getX(), 0, 'If ctrl is pressed and markers move synchronously to the left, left one should not get out of range');
  assert.equal(distanceBefore, distanceAfter, 'If ctrl is pressed, distance should stay the same even when getting out of range');




});
