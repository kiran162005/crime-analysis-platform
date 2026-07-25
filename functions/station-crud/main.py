from flask import Flask, request, jsonify

app = Flask(__name__)

stations = []

@app.route('/stations', methods=['POST'])
def create_station():
    data = request.json
    stations.append(data)
    return jsonify({"message": "Station Created", "data": data})

@app.route('/stations', methods=['GET'])
def get_all_stations():
    return jsonify(stations)

@app.route('/stations/<station_id>', methods=['GET'])
def get_station(station_id):
    for station in stations:
        if station["station_id"] == station_id:
            return jsonify(station)
    return jsonify({"message": "Station Not Found"}), 404

@app.route('/stations/<station_id>', methods=['PUT'])
def update_station(station_id):
    data = request.json
    for station in stations:
        if station["station_id"] == station_id:
            station.update(data)
            return jsonify({"message": "Updated", "data": station})
    return jsonify({"message": "Station Not Found"}), 404

@app.route('/stations/<station_id>', methods=['DELETE'])
def delete_station(station_id):
    global stations
    stations = [s for s in stations if s["station_id"] != station_id]
    return jsonify({"message": "Deleted"})

if __name__ == "__main__":
    app.run(debug=True)