# Listy

A grocery shopping list mobile app that utilizes Convolutional Neural Networks for automatic product recognition

![Alt Text](http://46.4.18.132/ezgif-3-a04d4b3d7e.gif)

# Project Structure

  - ./cnn-generator | Code related to preprocessing the dataset and training the CNN.
  - ./mobile-app | The code of the grocery list mobile app.
  - ./server | The API that gets the images from the mobile app, creates a job at REDIS and returns the predictions for the jobs that have finished running.
  - ./workers | Worker scripts that read from a REDIS queue, perform the prediction and write the results back to REDIS.

# Dataset

### Download Link
  - The dataset can be downloaded from "[here](http://46.4.18.132/data-processed.tar.xz)".

# How to run locally

### Requirements
  - A Redis instance running locally
  - Python3
  - Phonegap installed (both locally and on mobile phone)

### Needed Files
  - The model.h5 that you can download from "[here](http://46.4.18.132/model.h5)". This needs to be copied to the ./workers/model-224 folder

### Running the project

Start the server:
```sh
$ cd ./server/
$ export FLASK_APP=server.py
$ flask run --host "0.0.0.0"
```

Start as many workers as you want:
```sh
$ cd ./workers/
$ python3 worker.py
```

Start the phonegap server in order to test the mobile app:
```sh
$ cd ./mobile-app/
$ phonegap serve
```
