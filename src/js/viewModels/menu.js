/**
 * @license
 * Copyright (c) 2014, 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
define([
  '../accUtils',
  'knockout',
  'text!./food.json',
  'ojs/ojmodulerouter-adapter',
  'ojs/ojarraydataprovider',
  'ojs/ojknockout',
  'ojs/ojlistview',
  "ojs/ojmodule-element"
],
 function(accUtils, ko, foodJson, ModuleRouterAdapter, ArrayDataProvider) {
    function MenuViewModel(args) {
      // Below are a set of the ViewModel methods invoked by the oj-module component.
      // Please reference the oj-module jsDoc for additional information.

      /**
       * Optional ViewModel method invoked after the View is inserted into the
       * document DOM.  The application can put logic that requires the DOM being
       * attached here.
       * This method might be called multiple times - after the View is created
       * and inserted into the DOM and after the View is reconnected
       * after being disconnected.
       */
      this.connected = () => {
        accUtils.announce('Menu page loaded.', 'assertive');
        document.title = "Menu";
        // Implement further logic if needed
      };

      /**
       * Optional ViewModel method invoked after the View is disconnected from the DOM.
       */
      this.disconnected = () => {
        // Implement if needed
      };

      /**
       * Optional ViewModel method invoked after transition to the new View is complete.
       * That includes any possible animation between the old and the new View.
       */
      this.transitionCompleted = () => {
        // Implement if needed
      };

      const self = this

      self.foodData = JSON.parse(foodJson).food;
      
      self.dataProvider = new ArrayDataProvider(self.foodData);
      
      self.food = ko.observable();
      
      self.selection = ko.pureComputed({
          read: () => {
              const selected = [];
              const food = self.food();
              if (food) {
                  const index = self.foodData.indexOf(food);
                  selected.push(index);
              }
              return selected;
          },
          write: (selected) => {
            self.router.go({ path: 'details', params: { index: selected[0] } });
          }
      });

      self.args = args;
      
      self.router = self.args.parentRouter.createChildRouter([
          { path: 'details/{index}' },
          { path: '', redirect: 'details' }
      ]);
      
      self.router.currentState.subscribe((args) => {
          const state = args.state;
          if (state) {
            self.food(self.foodData[state.params.index]);
          }
      });
      
      self.module = new ModuleRouterAdapter(self.router, {
          viewPath: 'views/',
          viewModelPath: 'viewModels/'
      });
    }

    /*
     * Returns an instance of the ViewModel providing one instance of the ViewModel. If needed,
     * return a constructor for the ViewModel so that the ViewModel is constructed
     * each time the view is displayed.
     */
    return MenuViewModel;
  }
);
