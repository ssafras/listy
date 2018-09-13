/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app;
var $$ = Dom7;
var listData = [];
var serverEndpoint = "http://192.168.1.8:5000/";

// cordova.file.dataDirectory

var listy = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        listy.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        /*
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
        */
        if( id == "deviceready" ) {

            app = new Framework7({
              // App root element
              root: '#app',
              // App Name
              name: 'listy',
              // App id
              id: 'com.safras.listy',
              // Enable swipe panel
              panel: {
                swipe: 'left',
              },
              methods: {
                alert: function() {
                  app.dialog.alert('Hello World');
                }
              },
              // Add default routes
              routes: [
                {
                  path: '/about/',
                  url: 'about.html',
                },
              ],
              // Extended by Dialog component:
              dialog: {
                title: 'Listy Message',
                buttonOk: 'OK',
              },
              // ... other parameters
            });

            var mainView = app.views.create('.view-main');

            StatusBar.hide();
            screen.orientation.lock('portrait');
            // app.methods.alert('Hello World');

            // Start Progress Bar
            app.dialog.progress("Loading", color="orange");
            // Load listData

            // Load the list file and populate list to main page
            FileManager.loadListFile();

        }

    }
};

listy.initialize();


$$('.add_manually').on('click', function () {
  
  // document.onkeypress = function (e) {
  //   e = e || window.event;
  //   // use e.keyCode
  //   alert(e.keyCode);
  // };

  app.fab.close(document.getElementById("cornerFab"));

  app.dialog.prompt("Enter the name of the item:", "New Item", function(val){
    if( val == "" ) {
      app.dialog.alert('No value was entered.');      
    }else{
      ListManager.addToList(val, "", "");
    }
  }, function(val){
    log("User canceled. Do nothing.");
  });
});

var lastImage;
$$('.add_camera').on('click', function () {
  // app.dialog.alert('Add Using Camera');
  /**
   * Warning: Using DATA_URL is not recommended! The DATA_URL destination
   * type is very memory intensive, even with a low quality setting. Using it
   * can result in out of memory errors and application crashes. Use FILE_URI
   * or NATIVE_URI instead.
   */
  app.fab.close(document.getElementById("cornerFab"));

  navigator.camera.getPicture(onPictureSuccess, onPictureFail, { 
    quality: 25,
    destinationType: Camera.DestinationType.DATA_URL,
    correctOrientation: true,
    quality:85,
    targetWidth:512,
    targetHeight:512
  });

  function onPictureSuccess(imageData) {

    lastImage = "data:image/jpeg;base64," + imageData;

    custom_uuid = ListManager.uuid();

    // Display loading screen
    app.dialog.progress("Loading", color="orange");

    app.request.post(serverEndpoint+"add_job", { img64: imageData, uuid: custom_uuid }, function (data) {

      // Remove Progress Bar
      // app.dialog.close();

      // Load was performed. Start checking for response
      setTimeout(function(){ RequestManager.checkResults(custom_uuid); }, 2000);

    }, function (xhr, status) {

      // Remove Progress Bar
      app.dialog.close();

      // Image Upload Request Failed.
      app.dialog.alert('Connection to server failed. Try again.');

    });

  }

  function onPictureFail(message) {
      // alert('Failed because: ' + message);
      app.dialog.alert('No Camera Available');
  }

});

var RequestManager = {
  checkResults: function(uuid){

      app.request.get(serverEndpoint+"get_results/"+custom_uuid, null, function (data) {

        if(data!="PENDING"){

          log("Received Data");

          RequestManager.retryCounter = 0;

          item = JSON.parse(data);

          // Remove Progress Bar
          app.dialog.close();

          //Ask user to check class
          app.dialog.confirm("Is \""+item.name+"\" by \""+item.brand+"\" correct?", "Item Found", function(){
            // User Said OK
            ListManager.addToList(item.name, item.brand, lastImage);
          }, function(){
            // User Canceled
            app.dialog.alert('Please add the product manually.');
          });

        }else{
          RequestManager.retryCounter++;
          if( RequestManager.retryCounter > 10){
            //No response
            app.dialog.alert('Server did not respond. Try again later.');

            // Remove Progress Bar
            app.dialog.close();

          }else{
            setTimeout(function(){ RequestManager.checkResults(uuid); }, 2000);
            log("Trial No: "+RequestManager.retryCounter);
          }
        }
      });

  },
  retryCounter: 0
}

var ListManager = {
  addToList: function(itemName, itemBrand, itemPhoto, custom_uuid='') {
    if( itemPhoto == "" ) {
      itemPhoto = "img/no-image.jpg";
    }
    if( itemBrand == "" ) {
      itemBrand = "GENERIC BRAND";
    }

    var item = {
      name: itemName,
      brand: itemBrand,
      img: itemPhoto,
      uuid: custom_uuid
    };

    if(custom_uuid==''){
      item.uuid = ListManager.uuid();
    }

    listData.push(item);
    ListManager.addToListElement(item);

    saveList();

  },
  addToListElement: function(item) {
    $$(".items-list-ul").append(''+
      '<li class="li-'+item.uuid+'">' +
        '<a href="#" class="item-link item-content" onClick="ListManager.itemClick(this.id)" id="'+item.uuid+'">' +
          '<div class="item-media"><img src="'+item.img+'" width="44"/></div>' +
          '<div class="item-inner">' +
            '<div class="item-title-row">' +
              '<div class="item-title">'+item.name+'</div>' +
            '</div>' +
            '<div class="item-subtitle">'+item.brand+'</div>' +
          '</div>' +
        '</a>' +
      '</li>' +
    '');

  },
  removeFromList: function(item_id) {

    // Remove element from main listData
    _.remove(listData, { 'uuid': item_id });

    // Change opacity of entry (until next restart)
    $$(".li-"+item_id).css("opacity",0.4);

    // Save new listData to disk
    saveList();

    app.dialog.alert('The item will be deleted on the next app restart.');
  },
  itemClick: function(item_id) {
    // log(item_id);
    app.dialog.confirm("Are you sure?", "Delete Item", function(){
      // User Gave Permission
      // log( _.findIndex(listData, { 'uuid': item_id }) );
      ListManager.removeFromList(item_id);
    }, function(){
      // User Canceled
    });
  },
  uuid: function() {

    var uuid = "", i, random;
    for (i = 0; i < 32; i++) {
      random = Math.random() * 16 | 0;

      if (i == 8 || i == 12 || i == 16 || i == 20) {
        uuid += "-"
      }
      uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
    }
    return uuid;

  }
}

var FileManager = {
  listFileEntry: null,
  // list_data_filename: "data-"+ListManager.uuid()+".txt",
  list_data_filename: "data-main.txt",
  loadListFile: function() {
    
    // Attempt to access filesystem  
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {

      // Attempt to read list file
      fs.root.getFile(FileManager.list_data_filename, null, function (fileEntry) {

        // File was found
        FileManager.listFileEntry = fileEntry;

        //Read existing file
        FileManager.readFile(FileManager.listFileEntry);

      }, FileManager.onErrorGetFile);

    }, FileManager.onErrorLoadFs);

  },
  onErrorGetFile: function() {

    // The file was not found
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {

      // Attempt to create new file
      fs.root.getFile(FileManager.list_data_filename, { create: true, exclusive: false }, function (fileEntry) {

        FileManager.listFileEntry = fileEntry;

        // Add data to the new file that was created
        FileManager.writeFile(fileEntry, JSON.stringify(listData), newFile = true);

      }, FileManager.onErrorCreateFile);

    }, FileManager.onErrorLoadFs);

  },
  writeFile: function(fileEntry, dataObj, newFile = false) {

    // Create a FileWriter object for our FileEntry (.
    fileEntry.createWriter(function (fileWriter) {

      // On successfull file write
      fileWriter.onwriteend = function() {
        // if(callRead){
        //   //Read newly created file
        //   FileManager.readFile(FileManager.listFileEntry); 
        // }
        log("Data added to disk..");
        if(newFile){
          // Remove Progress Bar
          app.dialog.close();
          updateListVisibility();
        }
      };

      // On file write error
      fileWriter.onerror = function (e) {
        FileManager.onErrorWriteFile(e.toString());
      };

      // Write actual data on the file
      fileWriter.write(dataObj);
    });

  },
  readFile: function(fileEntry, msg="Empty") {

    fileEntry.file(function (file) {

      var reader = new FileReader();

      // Successfully loaded saved data
      reader.onloadend = function() {
        // Encode data to local list
        listData = JSON.parse(this.result);
        // Refresh list on main app
        loadList();
        // Remove Progress Bar
        app.dialog.close();
      };

      reader.readAsText(file);

    }, FileManager.onErrorReadFile);
  },
  onErrorLoadFs: function(error) {
    alert("Failed to access filesystem.");
    exit();
  },
  onErrorCreateFile: function(error) {
    alert("Failed to create data file.");
    exit();
  },
  onErrorReadFile: function(error) {
    alert("Failed to read data file.");
    exit();
  },
  onErrorWriteFile: function(error) {
    alert("Failed to read data file.");
    exit();
  }
}

function loadList() {

  // Populate "listData" on main page
  _.forEach(listData, function(item) {
    ListManager.addToListElement(item);
  });

  updateListVisibility();
}
function updateListVisibility(){
  if(listData.length>0){
    //Hide No Items Message
    $$('.no-items').css("display","none");
    //Display List
    $$('.items-list').css("display","block");
  }else {
    //Hide List
    $$('.items-list').css("display","none");
    //Display No Items Message
    $$('.no-items').css("display","block");
  }
}

function saveList(){
  // Save current list to local file
  FileManager.writeFile(FileManager.listFileEntry, JSON.stringify(listData));

  updateListVisibility();
}


// Helper functions
function exit(){
  if(navigator.app){
    navigator.app.exitApp();
  }else if(navigator.device){
    navigator.device.exitApp();
  }
}
function log(m){
  console.log(m);
}
