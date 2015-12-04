import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('timerange-marker', 'Integration | Component | timerange marker', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(1);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{timerange-marker}}`);

  assert.equal(this.$().text().trim(), '');

});

// test('dragging class assigned', assert => {
//   assert.expect(1);

//   this.render(hbs`{{timerange-marker}}`);
// });

