from flask import Flask, request, jsonify

app = Flask(__name__)

victims = []

@app.route('/victims', methods=['POST'])
def create_victim():
    data = request.json
    victims.append(data)
    return jsonify({"message": "Victim Created", "data": data})

@app.route('/victims', methods=['GET'])
def get_all_victims():
    return jsonify(victims)

@app.route('/victims/<victim_id>', methods=['GET'])
def get_victim(victim_id):
    for victim in victims:
        if victim["victim_id"] == victim_id:
            return jsonify(victim)
    return jsonify({"message": "Victim Not Found"}), 404

@app.route('/victims/<victim_id>', methods=['PUT'])
def update_victim(victim_id):
    data = request.json
    for victim in victims:
        if victim["victim_id"] == victim_id:
            victim.update(data)
            return jsonify({"message": "Updated", "data": victim})
    return jsonify({"message": "Victim Not Found"}), 404

@app.route('/victims/<victim_id>', methods=['DELETE'])
def delete_victim(victim_id):
    global victims
    victims = [v for v in victims if v["victim_id"] != victim_id]
    return jsonify({"message": "Deleted"})

if __name__ == "__main__":
    app.run(debug=True)