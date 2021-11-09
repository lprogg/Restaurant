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
  'ojs/ojarraydataprovider',
  'ojs/ojbufferingdataprovider',
  'ojs/ojconverter-number',
  'ojs/ojknockout',
  'ojs/ojinputtext',
  'ojs/ojinputnumber',
  'ojs/ojlabel',
  'ojs/ojvalidationgroup',
  'ojs/ojformlayout',
  'ojs/ojtoolbar',
  'ojs/ojmessages',
  'ojs/ojtable',
  'ojs/ojchart',
  'ojs/ojradioset'
],
 function(accUtils, ko, ArrayDataProvider, BufferingDataProvider, NumberConverter) {
    function ReservationViewModel() {
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
        accUtils.announce('Reservation page loaded.', 'assertive');
        document.title = "Reservation";
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

      const self = this;

      const foodArray = [
        { FoodIndex: 1, Name: 'Pizza', Type: 'Rustica', Mozzarella: 3, TomatoSauce: 5, Mushrooms: 5 },
        { FoodIndex: 2, Name: 'Pizza', Type: 'Romana', Mozzarella: 1, TomatoSauce: 1, Mushrooms: 4 }
      ];

      const barSeries = [
        { name: 'Mozzarella', items: [0] },
        { name: 'TomatoSauce', items: [0] },
        { name: 'Mushrooms', items: [0] }
      ];

      const barGroups = [' '];
      self.barSeriesValue = ko.observableArray(barSeries);
      self.barGroupsValue = ko.observableArray(barGroups);
      
      self.foodObservableArray = ko.observableArray(foodArray);
      
      self.dataProvider = new BufferingDataProvider(new ArrayDataProvider(self.foodObservableArray, {
        keyAttributes: 'FoodIndex',
      }));

      self.converter = new NumberConverter.IntlNumberConverter({
        useGrouping: false,
      });

      self.isEmptyTable = ko.observable(false);
      self.messageArray = ko.observableArray();
      self.groupValid = ko.observable();

      self.inputFoodIndex = ko.observable(0);
      self.inputName = ko.observable('');
      self.inputType = ko.observable('');
      self.inputMozzarella = ko.observable(0);
      self.inputTomatoSauce = ko.observable(0);
      self.inputMushrooms = ko.observable(0);

      self.firstSelected = ko.observable();
      self.disableSubmit = ko.observable(true);

      self.dataTransferHandler = (dataTransfer) => {
        const jsonStr = dataTransfer.getData("application/ojtablerows+json");

        if (jsonStr) {
            const jsonObj = JSON.parse(jsonStr);
            const q1Revs = [];
            const q2Revs = [];
            const q3Revs = [];

            self.barGroupsValue.removeAll();
            self.barSeriesValue.removeAll();
            
            for (let item of jsonObj) {
                let rawData = item.data;

                self.barGroupsValue.push(rawData.FoodIndex);
                
                q1Revs.push(rawData.Mozzarella);
                q2Revs.push(rawData.TomatoSauce);
                q3Revs.push(rawData.Mushrooms);
            }

            self.barSeriesValue.push({ name: 'Mozzarella', items: q1Revs });
            self.barSeriesValue.push({ name: 'TomatoSauce', items: q2Revs });
            self.barSeriesValue.push({ name: 'Mushrooms', items: q3Revs });
        }
      };

      self.handleDrop = (event) => {
        self.dataTransferHandler(event.dataTransfer);
        event.stopPropagation();
        event.preventDefault();
      };

      self.handleKey = (event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
              self.dataTransferHandler(clipboard);
          }
      };

      self.currentSelection = ko.observable('multiple');

      self.disableCreate = ko.computed(() => {
        return !self.inputFoodIndex() || self.groupValid() === "invalidShown";
      });

      self.disableRemoveUpdate = ko.computed(() => {
        const firstSelected = self.firstSelected();
        return (!firstSelected ||
            !firstSelected.key ||
            self.groupValid() === "invalidShown");
      });

      self.addRow = () => {
        if (self.groupValid() !== "invalidShown") {
            const food = {
                FoodIndex: self.inputFoodIndex(),
                Name: self.inputName(),
                Type: self.inputType(),
                Mozzarella: self.inputMozzarella(),
                TomatoSauce: self.inputTomatoSauce(),
                Mushrooms: self.inputMushrooms()
            };

            self.dataProvider.addItem({
                metadata: { key: food.FoodIndex },
                data: food,
            });
        }
    };

    self.updateRow = () => {
        if (self.groupValid() !== "invalidShown") {
            const element = document.getElementById("table");
            const currentRow = element.currentRow;
            if (currentRow != null) {
                const key = self.inputFoodIndex();
                
                const newData = {
                  FoodIndex: self.inputFoodIndex(),
                  Name: self.inputName(),
                  Type: self.inputType(),
                  Mozzarella: self.inputMozzarella(),
                  TomatoSauce: self.inputTomatoSauce(),
                  Mushrooms: self.inputMushrooms()
                };

                self.dataProvider.updateItem({ metadata: { key: key }, data: newData });
            }
        }
    };

    self.removeRow = () => {
        const element = document.getElementById("table");
        const currentRow = element.currentRow;
        if (currentRow != null) {
            const dataObj = element.getDataForVisibleRow(currentRow.rowIndex);
            self.dataProvider.removeItem({
                metadata: { key: dataObj.key },
                data: dataObj.data,
            });

            self.dataProvider.getTotalSize().then(function (value) {
                if (value == 0) {
                    self.isEmptyTable(true);
                }
            }.bind(self));

            element.selected = { row: new ojkeyset_1.KeySetImpl(), column: new ojkeyset_1.KeySetImpl() };
        }
    };

    self.removeAllRow = () => {
        self.dataProvider.fetchByOffset({ size: -1, offset: 0 }).then(function (fetchResults) {
            let dataArray = fetchResults.results;
            for (let i = 0; i < dataArray.length; i++) {
                self.dataProvider.removeItem(dataArray[i]);
            }

            self.dataProvider.getTotalSize().then(function (value) {
                if (value == 0) {
                    self.isEmptyTable(true);
                }
            }.bind(self));
        }.bind(self));
    };

    self.resetRows = () => {
        self.dataProvider.resetAllUnsubmittedItems();
        self.isEmptyTable(self.dataProvider.isEmpty() === "yes");
        self.messageArray([
            {
                severity: "confirmation",
                summary: "Changes have been reset.",
                autoTimeout: 4000,
            },
        ]);
    };

    self.findIndex = (key) => {
        const ar = self.foodObservableArray();
        for (let idx = 0; idx < self.foodObservableArray().length; idx++) {
            if (ar[idx].FoodIndex === key) {
                return idx;
            }
        }
        return -1;
    };

    self.commitOneRow = (editItem) => {
        const idx = self.findIndex(editItem.item.metadata.key);
        let error;
        if (idx > -1) {
            if (editItem.operation === "update") {
                self.foodObservableArray.splice(idx, 1, editItem.item.data);
            }
            else if (editItem.operation === "remove") {
                self.foodObservableArray.splice(idx, 1);
            }
            else {
                error = {
                    severity: "error",
                    summary: "add error",
                    detail: "Row with same key already exists",
                };
            }
        }
        else {
            if (editItem.operation === "add") {
                self.foodObservableArray.splice(self.foodObservableArray().length, 0, editItem.item.data);
            }
            else {
                error = {
                    severity: "error",
                    summary: editItem.operation + " error",
                    detail: "Row for key cannot be found",
                };
            }
        }
        if (error) {
            return Promise.reject(error);
        }
        return Promise.resolve();
    };

    self.submitRows = () => {
        self.disableSubmit(true);
        const editItems = self.dataProvider.getSubmittableItems();
        editItems.forEach((editItem) => {
            self.dataProvider.setItemStatus(editItem, "submitting");
            self.commitOneRow(editItem)
                .then(() => {
                    self.dataProvider.setItemStatus(editItem, "submitted");
                })
                .catch((error) => {
                    self.dataProvider.setItemStatus(editItem, "unsubmitted", error);
                    var errorMsg = {
                        severity: error.severity,
                        summary: error.summary,
                        autoTimeout: 4000,
                    };
                    self.messageArray.push(errorMsg);
                });
        });
        self.messageArray([
            {
                severity: "confirmation",
                summary: "Changes have been submitted.",
                autoTimeout: 4000,
            },
        ]);
    };

    self.firstSelectedRowChangedListener = (event) => {
        const itemContext = event.detail.value;
        if (itemContext && itemContext.data) {
            const food = itemContext.data;

            self.inputFoodIndex(food.FoodIndex),
            self.inputName(food.Name),
            self.inputType(food.Type),
            self.inputMozzarella(food.Mozzarella),
            self.inputTomatoSauce(food.TomatoSauce),
            self.inputMushrooms(food.Mushrooms)
        }
    };

    self.hideTable = (hide) => {
        const table = document.getElementById("table");
        const noDataDiv = document.getElementById("noDataDiv");
        if (hide === true) {
            table.classList.add("oj-sm-hide");
            noDataDiv.classList.remove("oj-sm-hide");
        }
        else {
            table.classList.remove("oj-sm-hide");
            noDataDiv.classList.add("oj-sm-hide");
        }
    };

    self.dataProvider.addEventListener("submittableChange", (event) => {
        const submitTable = event.detail;
        self.disableSubmit(submitTable.length === 0);
    });

    self.dataProvider.addEventListener("mutate", (event) => {
        if (self.isEmptyTable() === true && event.detail.add != null) {
            self.isEmptyTable(false);
        }
    });

    self.isEmptyTable.subscribe((newValue) => {
        self.hideTable(newValue);
    });

    self.isEmptyTable(self.dataProvider.isEmpty() === "yes");
    }

    /*
     * Returns an instance of the ViewModel providing one instance of the ViewModel. If needed,
     * return a constructor for the ViewModel so that the ViewModel is constructed
     * each time the view is displayed.
     */
    return ReservationViewModel;
  }
);
