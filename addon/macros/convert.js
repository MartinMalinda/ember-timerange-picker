import Ember from 'ember';

const {
  computed,
  get
} = Ember;

export function offsetToMinutes(dependentKey) {
  return computed('width', dependentKey, function(){
    let offset = this.get(dependentKey);
    return Math.round(offset / this.get('width') * this.get('minutesInRange')) + this.get('minMinutes');
  });
}

export function minutesToOffset(dependentKey){
  return computed('width', dependentKey, function(){
    let minutes = this.get(dependentKey);
    return Math.round((minutes) * this.get('width') / this.get('minutesInRange'));
  });
}

export function timeToMinutes(dependentKey){
  return computed(dependentKey, function(){
    return convertTimeToMinutes(this.get(dependentKey));
  })
}

export function minutesToTime(dependentKey){
  return computed(dependentKey, function(){
    return convertMinutesToTime(this.get(dependentKey));
  });
}

export function convertTimeToMinutes(timeString){
  var minutes = parseInt(timeString.split(":")[1]);
  var hours = parseInt(timeString.split(":")[0]);

  return minutes + hours*60;
}

export function convertMinutesToTime(totalminutes){
  var hours = (Math.floor(totalminutes / 60)).toString();
  if(hours.length === 1){
    hours = "0"+hours;
  }
  var minutes = (totalminutes % 60).toString();
  if(minutes.length === 1){
    minutes = "0"+minutes;
  }
  
  return `${hours}:${minutes}`;
}
