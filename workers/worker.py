import keras
from keras.models import Sequential
from keras.models import model_from_json
from keras.models import load_model
from keras.layers import Dense, Dropout, Flatten
from keras.layers import Conv2D, MaxPooling2D
from keras import backend as K
from keras.preprocessing import image
from keras.applications.vgg16 import preprocess_input
from keras.preprocessing.image import ImageDataGenerator
from PIL import ImageFile
import matplotlib.pyplot as plt
import numpy as np
import os
import redis
import time
import csv
ImageFile.LOAD_TRUNCATED_IMAGES = True

# Load classes definition
with open('classes.csv', 'r') as f:
  reader = csv.reader(f)
  class_data = list(reader)

# Load json and create model
json_file = open('./model-224/model.json', 'r')
loaded_model_json = json_file.read()
json_file.close()
loaded_model = model_from_json(loaded_model_json)

# Load weights into new model
# loaded_model.load_weights("./model-2/model.h5")
loaded_model.load_weights("./model-224/model.h5")
print("Loaded model from disk")

# Dimensions of our images
img_width, img_height = 224, 224 

# Establish a connection to Redis
r = redis.StrictRedis(host='localhost', port=6379, db=0)

while True:

    data = r.rpop('cnn-jobs')
    if data != None:
        data = data.decode("utf-8")
        split_data = data.split("|||")

        split_data.append("../server/"+split_data[0][2:])

        imgs = [ split_data[-1] ]

        img_data = []

        for img_path in imgs:
            # predicting images
            img = image.load_img(
                img_path, 
                target_size=(img_width, img_height),
                color_mode="rgb")
            x = image.img_to_array(img)
            x = np.expand_dims(x, axis=0)
            x = preprocess_input(x)
            img_data.append(x)

        # pass the list of multiple images np.vstack()
        images = np.vstack(img_data)
        classes = loaded_model.predict_classes(images, batch_size=32)

        # Add to redis the result of the worker
        # print(classes[0])
        # print(type(classes[0]))
        # print(class_data[classes[0]])
        print("Added Results to: "+split_data[1])
        r.set(split_data[1],'{"name":"'+class_data[classes[0]][2]+'","brand":"'+class_data[classes[0]][3]+'"}')
        
    time.sleep(1)
