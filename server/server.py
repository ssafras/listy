from flask import Flask
from flask import request
import redis
import base64
from PIL import Image, ImageOps
app = Flask(__name__)

r = redis.StrictRedis(host='localhost', port=6379, db=0)

@app.route('/')
def index():
    return 'Homepage!'

@app.route('/add_job', methods=['POST'])
def add_job():
    img64 = request.form['img64']
    uuid = request.form['uuid']
    imgdata = base64.b64decode(img64)
    filename = './'+uuid+'.jpg'
    with open(filename, 'wb') as f:
        f.write(imgdata)

    # Do the actual resizing
    desired_size = 224

    im = Image.open(filename)
    old_size = im.size  # old_size[0] is in (width, height) format

    ratio = float(desired_size)/max(old_size)
    new_size = tuple([int(x*ratio) for x in old_size])

    im = im.resize(new_size, Image.ANTIALIAS)

    new_im = Image.new("RGB", (desired_size, desired_size))
    new_im.paste(im, ((desired_size-new_size[0])//2,
                        (desired_size-new_size[1])//2))

    new_path = './'+"fixed-"+uuid+'.jpg'
    new_im.save(new_path)

    r.lpush('cnn-jobs', new_path+"|||"+uuid)
    # r.set(uuid,"PENDING")

    return 'OK'

@app.route('/get_results/<uuid>')
def get_results(uuid):
    # return '{"name": "Cleaner Ajax", "brand":"Nestle"}'
    data = r.get(uuid)
    if data == None:
        return "PENDING"
    else:
        r.delete(uuid)
        return data.decode("utf-8")