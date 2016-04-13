import Ember from 'ember';

const {
  computed,
  get
} = Ember;

export function sumOf(dependentKey1, dependentKey2){
  return computed(dependentKey1, dependentKey2, function(){
    return this.get(dependentKey1) + this.get(dependentKey2);
  })
}

export function substractSecondFromFirst(dependentKey1, dependentKey2){
  return computed(dependentKey1, dependentKey2, function(){
    return this.get(dependentKey1) - this.get(dependentKey2);
  })
}