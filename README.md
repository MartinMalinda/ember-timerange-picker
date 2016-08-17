# Ember-timerange-picker

DEMO: http://martinmalinda.github.io/ember-timerange-picker/
![Addon preview](https://i.imgur.com/rI5se3S.png)

```handlebars
{{timerange-picker
	interval="15"
	minTime="06:00"
	maxTime="12:00"
	class="time-range-picker"
	afterDrag=(action "getTimeRange") 
	initFromValue="08:00"
	initToValue="10:00"
}}
```

**Supported attrs**:
 - Interval: minimal amount of minutes needed to change value (default: 15)
 - maxTime: Maximal time (default: 24:00)
 - minTime: Minimal time (defualt: 00:00)
 - minDuration: Minimal duration that can be picked (defaults to Interval, setting this to 0 is not reccomended)
 - maxDuration: Maximum duration that can be picked - **WIP**
 - class: Applied to the whole element
 - containerClass: Applied to the internal container element
 - afterDrag(fromTime, toTime): Action called after the dragging has ended
 - onChange(fromTime, toTime): Action called whenever any value changed
 - initFromValue: starting value of the "from" marker // binding not supported atm
 - initToValue: starting value of the "to" marker // binding not supported atm

**Features**
 - control + drag for synchronous dragging of both markers (TODO: make it work with cmd button for mac)


**The addon does not currently come with styling, feel free to grab this SCSS**
```scss
* {box-sizing:border-box;}
$red:#DB2828; 

.time-range-picker {
	width: 100%;
	height: 75px;
	position: relative;
	border: 1px solid transparentize(grey, 0.8);
	border-radius: 5px;
	background: transparentize(grey, 0.9);
	user-select:none;
	-webkit-user-select:none;
	padding: 25px 30px;

	.tp-container {
		width: 96%;
		margin: 2%;
		position: relative;
	}

	.marker {
		position: absolute;
		width: 28px;
		height: 28px;
		background: transparentize($red, 0.5);
		border: 2px solid $red;
		border-radius:50%;
		cursor: pointer;
		top: -14px;
		z-index: 2;
		transition: 0.2s background;

		&.from {

			background: transparentize(green, 0.5);
			border: 2px solid green;

			&.dragging {
				background: transparentize(green, 0);
			}

			&:hover {
				z-index: 3;
			}
		}

		&.to {
			&.dragging {
				background: transparentize($red, 0);
			}
		}
	}

	.icon {
		font-size:2rem;
	}

	.line {
		width: 100%;
		height: 5px;
		position: absolute;
		left: 0;
		top: 0;
		transform: translate(0,-50%);	
		background: gray;
		border-radius: 5px;
	}
}
```

ToDO

 - [x] require chronology
 - [x] implement container to provide whitespace
 - [x] sync marker movement on ctrlKey
 - [x] settable min and max time
 - [x] touch support
 - [ ] improve the code quality of the mouseMove function
 - [x] interval set by a param
 - [x] set marker width on didInsertElement
 - [ ] AM/PM format
 - [ ] minutes format
 - [x] onChange function
 - [ ] write tests
  - [x] test the onChange and afterDrag function
  - [ ] test the interval
  - [x] test resize functionality
  - [x] test ctrlKey dragging
  - [x] test dragging out of range
  - [ ] test min and max duration
 - [ ] render into SVG (optionally?)
 - [x] settable minDuration
 - [ ] settable maxDuration
  - [x] basic functionality
  - [ ] sync dragging if limits are reached
  - [ ] make sure X = limit if limit is reached
 - [ ] update chronology check when ctrlKey is pressed
 - [ ] write custom computed macros
 - [ ] synchronous dragging when dragging space between markers
  - [ ] styles
  - [ ] functionality
