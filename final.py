# 宣告使用模組
from flask import Flask, render_template, redirect, url_for, request, session
from datetime import datetime, timedelta
from flask.globals import current_app
from flask_bootstrap import Bootstrap
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
import yfinance as yf
import pandas as pd
import json

# 建立 Flask 類別實例
app = Flask(__name__)
app.config['SECRET_KEY'] = 'plsssss dont attack me'
# 連線 Mongo DB
app.config["MONGO_URI"] = "mongodb://localhost:27017/Industry4"
mongo = PyMongo(app)
stock = mongo.db.stock
# 引入 bootstrap 套件
bootstrap = Bootstrap(app)

# 在網頁 requset 前設定 session 參數初始值
@app.before_first_request
def setup():
    session['stock_number'] = ""
    session['time'] = "1d"
    session['start_date'] = '2021-06-07'
    session['order'] = 0
    

# 默認路由，進入網站後若無指定路徑就導到這裡
@app.route('/', methods=['GET', 'POST'])
def index():
    # if 條件成立代表使用者剛進入網站，尚無查詢紀錄
    if session.get('stock_number') == "" :
        # 給予一組空資料避免 JS 函數 error
        stock_data = {"data": [{ "Datetime": "", "Open": "", "High": "", "Low": "", "Close": "", "Adj Close": "", "Volume": ""}]}
    
    #  如果由其他路由重新導向，則使用 session 參數下載資料
    else:
        # yahoo finance API 參數
        # ------------------------------------------------------------
        stockNo = session.get('stock_number')       # 上市: .TW   上櫃、興櫃: .TWO
        start_date = session.get('start_date')
        end_date = '2021-06-11'
        interval = session.get('time')              # 1m,2m,5m,15m,30m,60m,90m,1h,1d,5d,1wk,1mo,3mo
        # ------------------------------------------------------------

        # 下載資料
        data = yf.download(stockNo, start=start_date, end=end_date, interval=interval)
        # 資料格式處理
        result = data.to_json(orient="table")
        stock_data = json.loads(result)
        stock_data.pop('schema', None)
        if (interval != '1d'):
            for data in stock_data['data']:
                time = data.pop("Datetime")
                datetime_object = datetime.strptime(time, '%Y-%m-%dT%H:%M:%S.000Z')
                delta = timedelta(hours=8)
                datetime_object += delta        
                data["Date"] = datetime_object.strftime('%Y-%m-%dT%H:%M:%S.000Z')
        # 將資料存入 Mongo DB
        stock.insert_one(stock_data)
    
    if request.method == 'POST':
        session['stock_number'] = request.values.get('number1')
        session['start_date'] = request.values.get('date1')
        # The parameters of this block should depends on user's input
        # ------------------------------------------------------------
        stockNo = request.values.get('number1')     # 上市: .TW   上櫃、興櫃: .TWO
        start_date = session.get('start_date')
        end_date = '2021-06-11'
        interval = '1d'              # 1m,2m,5m,15m,30m,60m,90m,1h,1d,5d,1wk,1mo,3mo
        # ------------------------------------------------------------
        data = yf.download(stockNo, start=start_date, end=end_date, interval=interval)

        result = data.to_json(orient="table")
        stock_data = json.loads(result)
        stock_data.pop('schema', None)
        if (interval != '1d'):
            for data in stock_data['data']:
                time = data.pop("Datetime")
                datetime_object = datetime.strptime(time, '%Y-%m-%dT%H:%M:%S.000Z')
                delta = timedelta(hours=8)
                datetime_object += delta        
                data["Date"] = datetime_object.strftime('%Y-%m-%dT%H:%M:%S.000Z')
        stock.insert_one(stock_data)
        session['order'] = session.get('order') + 1

    return render_template('index.html', stock_data=stock_data['data'], stock_number=session.get('stock_number'), order = session.get('order'))

# 功能性路由，執行後重新導向默認路由
@app.route('/oneday')
def oneday():
    # 變更 session 參數：取樣頻率
    session['time'] = "1d"
    return redirect(url_for('index'))

@app.route('/sixty')
def sixty():
    session['time'] = "60m"
    return redirect(url_for('index'))

@app.route('/five')
def five():
    session['time'] = "5m"
    return redirect(url_for('index'))