import { moduleForComponent, test } from 'ember-qunit';
// import wait from 'ember-testing';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('timerange-picker', 'Integration | Component | timerange picker', {
  integration: true
});




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
    return Math.round(this.$m.offset().left - this.$container.offset().left + this.width/2);
  };

  this.getP = function(){
    return this.getX()/this.$container.width();
  };

  this.getOffset = function(){
    return Math.round(this.$m.offset().left);
  };

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
  };

  this.moveAbs = function(percentageX){

    var containerOffsetLeft = this.$container.offset().left;
    this.previousOffset = this.getOffset();


    Ember.run(() => {
      $.extend(this.mousemove, {
        clientX: containerOffsetLeft + percentageX * this.$container.width(),
        clientY: this.offsetTop,
        ctrlKey: this.ctrlKey
      });

      this.drag();
    });
  };

  this.smoothDrag = function(percentageX){

    var currentPercentage = Math.round(this.getP()*100);
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
  };

  this.drag = function(){
    this.$m.trigger('mousedown');
    this.$container.trigger(this.mousemove);
    this.$container.trigger('mouseup');
  };
};

function getDistance (leftMarker, rightMarker){
  return Math.round(Math.abs(rightMarker.getOffset() - leftMarker.getOffset()));
}

// function makeStepped(x, stepper){
//   return Math.round(x/stepper)*stepper;
// }

var ctrlKeydown = $.Event("keydown");
ctrlKeydown.which = 17;

test('it renders', function(assert) {
  assert.expect(4);

  this.render(hbs`
    {{timerange-picker class="time-range-picker" containerClass="my-container" initFromValue="8:00" initToValue="18:00"}}
  `);

  assert.equal(this.$().text().trim(), '8:00 - 18:00 (10:00)', 'Times are displayed');
  assert.equal(this.$('.my-container').length, 1, 'There is 1 container present');
  assert.equal(this.$('.marker').length, 2, 'There are 2 markers present');
  assert.equal(this.$('.line').length, 1, 'There is 1 line present');
});

test('marker has dragging class during dragging', function(assert) {
  assert.expect(6);

  this.render(hbs`
    {{timerange-picker class="time-range-picker" initFromValue="8:00" initToValue="18:00"}} 
  `);

  var marker = new markerStruct(this.$('.marker:eq(0)'), 'left', this.$('.time-range-picker:eq(0)'), 28);
  var rightMarker = new markerStruct(this.$('.marker:eq(1)'), 'right', this.$('.time-range-picker:eq(0)'), 28);

  Ember.run(() => marker.$m.trigger('mousedown'));
  assert.ok(marker.$m.hasClass('dragging'), 'Marker has class dragging after mousedown');
  Ember.run(() => marker.$container.trigger('mouseup'));
  assert.ok(!marker.$m.hasClass('dragging'), 'Marker has not dragging class after mouseup');
  Ember.run(() => marker.$m.trigger('mousedown'));
  assert.ok(marker.$m.hasClass('dragging'), 'Marker has class dragging again after mousedown');
  Ember.run(() => marker.$container.trigger('mouseleave'));
  assert.ok(!marker.$m.hasClass('dragging'), 'Marker has not dragging class after mouseleave');

  var ctrlMousemove = $.Event('mousemove');
  ctrlMousemove.ctrlKey = true;
  Ember.run(() => marker.$m.trigger('mousedown'));
  Ember.run(() => marker.$container.trigger(ctrlMousemove));
  assert.ok(marker.$m.hasClass('dragging'), 'If ctrl is pressed, left marker has class dragging');
  assert.ok(rightMarker.$m.hasClass('dragging'), 'If ctrl is pressed, right marker has class dragging');

});

test('markers move properly when dragged', function(assert){
  assert.expect(12);

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
  rightMarker.ctrlKey = true;
  rightMarker.moveAbs(0.9);
  assert.notEqual(rightMarker.getOffset(),rightMarker.previousOffset, 'If ctrl is pressed and right marker is dragged to the right, it moves');
  rightMarker.ctrlKey = false;

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


  leftMarker.ctrlKey = false;
  rightMarker.ctrlKey = false;
  rightMarker.moveAbs(0.58);
  leftMarker.moveAbs(0.55);
  distanceBefore = getDistance(leftMarker, rightMarker);
  leftMarker.ctrlKey = true;
  leftMarker.moveAbs(0.8);
  distanceAfter = getDistance(leftMarker, rightMarker);

  // leftMarker.getX()
  assert.equal(leftMarker.getX(), $container.width()*0.8, 'If ctrl is pressed and the drag is really fast, markers should not collide');
  assert.equal(distanceBefore, distanceAfter, 'If ctrl is pressed and the drag is really fast, distance should stay the same');

});

test('setting minimum and maximum durations', function(assert){
  assert.expect(2);

  var minDuration = 60;
  var maxDuration = 300;

  this.render(hbs`
    {{timerange-picker minDuration="60" maxDuration="300" class="time-range-picker" initFromValue="08:00" initToValue="10:00"}} 
  `);

  var leftMarker = new markerStruct(this.$('.marker:eq(0)'), 'left', this.$('.tp-container:eq(0)'), 28);
  var rightMarker = new markerStruct(this.$('.marker:eq(1)'), 'right', this.$('.tp-container:eq(0)'), 28);
  var $container = leftMarker.$container;

  var expectedDistance = Math.round(minDuration * $container.width() / (60*24));

  leftMarker.moveAbs(0.5);
  rightMarker.moveAbs(0.4);
  // rightMarker.smoothDrag(0.4);

  var actualDistance = getDistance(leftMarker, rightMarker);
  assert.equal(actualDistance, expectedDistance, 'Markers should stop at minimal distance if minDuration is set');

  leftMarker.moveAbs(0);
  rightMarker.moveAbs(1);
  expectedDistance = Math.round(maxDuration * $container.width() / (60*24));
  actualDistance = getDistance(leftMarker, rightMarker);
  assert.equal(actualDistance, expectedDistance, 'Markers should stop at maximal distance if maxDuration is set');

});

test('closure actions are called at the right times', function(assert){
  assert.expect(2);

  this.set('afterDrag', () => assert.ok(true, 'afterDrag action has been called after moving marker'));
  this.set('onChange', () => assert.ok(true, 'onChange action has been called after to and from value changed'));

  this.render(hbs`
    {{timerange-picker afterDrag=(action afterDrag) onChange=(action onChange) class="time-range-picker" initFromValue="0:00" initToValue="24:00"}} 
  `);

  var leftMarker = new markerStruct(this.$('.marker:eq(0)'), 'left', this.$('.tp-container:eq(0)'), 28);
  // var rightMarker = new markerStruct(this.$('.marker:eq(1)'), 'right', this.$('.tp-container:eq(0)'), 28);
  // var $container = leftMarker.$container;

  leftMarker.moveAbs(0.4); 
  // afterDrag should be called now
  // onChange should be called now

});

test('settable min and max time', function(assert){
  assert.expect(4);

  this.set('minTime', "06:00");
  this.set('maxTime', "12:00");

  this.render(hbs`
    {{timerange-picker minTime=minTime maxTime=maxTime class="time-range-picker" initFromValue="08:00" initToValue="10:00"}} 
  `);

  var leftMarker = new markerStruct(this.$('.marker:eq(0)'), 'left', this.$('.tp-container:eq(0)'), 28);
  var rightMarker = new markerStruct(this.$('.marker:eq(1)'), 'right', this.$('.tp-container:eq(0)'), 28);

  leftMarker.moveAbs(0);
  rightMarker.moveAbs(1);

  assert.equal(this.$().text().trim(), `${this.get('minTime')} - ${this.get('maxTime')} (06:00)`, 'When markers move to the max and min offset, they have the minTime and maxTime values.');

  leftMarker.ctrlKey = true;
  leftMarker.moveAbs(0.3);

  assert.equal(this.$().text().trim(), `${this.get('minTime')} - ${this.get('maxTime')} (06:00)`, 'After sync dragging leftMarker, markers still stay in min and max range');

  leftMarker.ctrlKey = false;
  rightMarker.ctrlKey = true;
  rightMarker.moveAbs(0.9);
  rightMarker.ctrlKey = false;

  assert.equal(this.$().text().trim(), `${this.get('minTime')} - ${this.get('maxTime')} (03:00)`, 'After sync dragging rightMarker, markers still stay in min and max range');

  leftMarker.moveAbs(0.5);

  assert.equal(this.$().text().trim(), `09:00 - ${this.get('maxTime')} (06:00)`, 'Half way between 06:00 and 12:00, the value should be 09:00');

});
