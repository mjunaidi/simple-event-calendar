(function() {
  'use strict';

  angular.module('app.model').controller('MainController', MainController);

  MainController.$inject = [ 'modelService', 'themeService', 'storageService',
              '$uibModal', '$document', '$crypto', '$http', '$scope', '$location',
              '$timeout', 'hotkeys', 'uuid4'
            ];

  var DEFAULT_KEY = '';
  var ALPHABETS = 'abcdefghijklmnopqrstuvwxyz';

  function MainController(modelService, themeService, storageService, uibModal,
          document, crypto, http, scope, location, timeout, hotkeys, uuid4) {
    this._modelService = modelService;
    this._themeService = themeService;
    this._storageService = storageService;
    this._modal = uibModal;
    this._document = document;
    this._crypto = crypto;
    this._http = http;
    this._scope = scope;
    this._location = location;
    this._timeout = timeout;
    this._hotkeys = hotkeys;
    this._uuid4 = uuid4;

    this._initHeader();
    // _initBody called with ng-init in each page
    //this._initBody();
  }

  MainController.prototype._initHeader = function() {

    this.navbar = {
      templateUrl : 'app/ui/html/navbar.html',
      pages: [
        {
          "name" : "Home", "path" : "/", "ra" : false
        }, {
          "name" : "Blog", "path" : "/blog", "ra" : false
        }
      ]
    };

    //this.themes = this._themeService.themes();
    this.themes = [ "default", "cerulean", "cosmo", "cyborg", "darkly", "flatly",
              "journal", "lumen", "paper", "readable", "sandstone", "simplex",
              "slate", "solar", "spacelab", "superhero", "united", "yeti" ]; // zero-index
    this._themeService._themes = this.themes;
    this.store('theme', this._themeService.pick(8));

    // FIXME: this.aboutOpts.config --> get.paths did not start with relative path
    this.aboutOpts = {
      templateUrl : 'app/ui/html/about.html',
      config : function() {
        return {
          'get' : {
            'paths' : [ 'simple-event-calendar/app/ui/json/about.json' ],
            'key' : 'init'
          }
        };
      }
    };

    // You can pass it an object.  This hotkey will not be unbound unless manually removed
    // using the hotkeys.del() method
    this._hotkeys.add({
      combo: 'ctrl+v',
      description: 'Paste from clipboard',
      callback: function() {
        console.log('ctrl+v');
      }
    });
  };

  MainController.prototype._initBody = function() {
    if (this._location.path() === '/') {
      this.initCalendar();
    }

    if (this._location.path() === '/blog') {
      /* Anything that needs to be executed in path /free goes here... */
    }
  };

  MainController.prototype.initCalendar = function() {
    var ctrl = this;

    // display part
    var days = [
      {"name" : "Sunday"},
      {"name" : "Monday"},
      {"name" : "Tuesday"},
      {"name" : "Wednesday"},
      {"name" : "Thursday"},
      {"name" : "Friday"},
      {"name" : "Saturday"},
    ];
    for (var i in days) {
      var day = days[i];
      day.short = day.name.charAt(0);
    }

    var weeks = [
      {"name" : "Week 1"},
      {"name" : "Week 2"},
      {"name" : "Week 3"},
      {"name" : "Week 4"},
      {"name" : "Week 5"}
    ];

    var months = [
      {"name" : "January"},
      {"name" : "February"},
      {"name" : "March"},
      {"name" : "April"},
      {"name" : "May"},
      {"name" : "June"},
      {"name" : "July"},
      {"name" : "August"},
      {"name" : "September"},
      {"name" : "October"},
      {"name" : "November"},
      {"name" : "December"}
    ];

    ctrl.names = {
      "days" : days,
      "weeks" : weeks,
      "months" : months
    };

    // data part
    var today = new Date();
    var y = today.getFullYear();
    ctrl.cal = {
      "years" : []
    };
    ctrl.setYear(y);
  };

  MainController.prototype.setYear = function(y) {
    var ctrl = this;
    if (_.findWhere(ctrl.cal.years, {"id":y}) === undefined) {
      if (y < ctrl.currentYear) {
        ctrl.cal.years.unshift(ctrl.createYear(y));
      } else  {
        ctrl.cal.years.push(ctrl.createYear(y));
      }
    }
    ctrl.currentYear = y;
  };

  MainController.prototype.prevYear = function() {
    var ctrl = this;
    ctrl.currentYear--;
    ctrl.setYear(ctrl.currentYear);
  };

  MainController.prototype.nextYear = function() {
    var ctrl = this;
    ctrl.currentYear++;
    ctrl.setYear(ctrl.currentYear);
  };

  MainController.prototype.createYear = function(y) {
    var ctrl = this;
    var year = {
      "id" : y
    };
    var months = [];
    for (var i=0; i<12; i++) {
      var month = {
        "dates" : []
      };
      var started = false;
      var week = 0;
      for (var j=0; j<31; j++) {
        var dt = new Date(Date.UTC(y, i, j+1));
        if (dt.getMonth() > i) {
          break;
        }
        if (!started) {
          for (var k=0; k<dt.getDay(); k++) {
            month.dates.push({
              "week" : week
            });
          }
          started = true;
        }
        dt.week = week;
        month.dates.push(dt);
        if (dt.getDay() == 6) {
          week++;
        }
      }
      months.push(month);
    }
    year.months = months;
    return year;
  };

  MainController.prototype.dummy = function() {

  };

  // existing utitlity codes
  MainController.prototype.generateUuid = function() {
    this.uuid = this._uuid4.generate();
  };

  MainController.prototype.save = function(str) {
    if (typeof str === 'string' && str.trim().length > 0) {
      str = str.trim();
      var exist = false;
      for ( var i in this.saved) {
        var entry = this.saved[i];
        if (entry === str) {
          exist = true;
          break;
        }
      }
      if (exist === false) {
        this.saved.push(str);
        this.set('saved', this.saved);
      }
    }
  };

  MainController.prototype.remove = function(str) {
    if (typeof str === 'number') {
      this.saved.splice(str, 1);
      if (this.saved.length <= 0) {
        this.saved = DEFAULT_LIST;
      }
      this.set('saved', this.saved);
    } else if (typeof str === 'string') {
      var exist = false;
      for ( var i in this.saved) {
        var entry = this.saved[i];
        if (entry === str) {
          this.saved.splice(i, 1);
          exist = true;
          break;
        }
      }
      if (exist === true) {
        if (this.saved.length <= 0) {
          this.saved = _.map(DEFAULT_LIST, _.clone);
        }
        this.set('saved', this.saved);
      }
    }
  };

  MainController.prototype.set = function(key, val) {
    this._modelService.set(this, key, val);
  };

  MainController.prototype.store = function(key, val) {
    var storeKey = 'data_' + key;
    this._modelService.watch(this, [ key ], 'store' + key, (function() {
      this._storageService.saveObject(this[key], storeKey);
    }).bind(this));
    var stored = this._storageService.loadObject(storeKey);
    if (typeof stored !== 'undefined' && stored !== null) {
      if (typeof stored.length !== 'undefined' && stored.length > 0) {
        this[key] = stored;
      } else if (typeof stored === 'boolean') {
        this[key] = stored;
      }
    }
    if (typeof this[key] === 'undefined') {
      this[key] = val;
    }
  };

  MainController.prototype.openModal = function() {
    this.modal({
      templateUrl: 'app/ui/html/modal.html'
    });
  };

  MainController.prototype.modal = function(args) {
    if (typeof args === 'undefined') {
      args = {};
    }
    if (typeof args === 'object') {
      args.animation = args.animation ? args.animation : true;
      args.size = args.size ? args.size : 'md';
      args.config = args.config ? args.config : null;
    }
    var self = this;
    var modalInstance = this._modal.open({
      animation : args.animation,
      templateUrl : args.templateUrl,
      controller : 'ModalController as ctrl',
      size : args.size,
      resolve : {
        parentCtrl : function() {
          return self;
        },
        config : args.config
      }
    });

    // TODO: this feature to be updated in the future
    modalInstance.result.then(function() {
    }, function() {
    });
  };

  MainController.prototype.links = function(str, links) {
    if (typeof str === 'undefined' || typeof links === 'undefined') {
      return str;
    }
    var template = '<a href="{url}" target="_blank">{label}</a>';
    for ( var i in links) {
      var link = links[i];
      var a = template.replace('{url}', link.url).replace('{label}', link.name);
      str = str.replace(link.name, a);
    }
    return str;
  };

})();
