from flask import Flask, request, jsonify

app = Flask(__name__)

incidents = []

# CREATE
@app.route('/incidents', methods=['POST'])
def create_incident():
    data = request.json
    incidents.append(data)
    return jsonify({"message": "Incident Created", "data": data})

# GET ALL
@app.route('/incidents', methods=['GET'])
def get_all_incidents():
    return jsonify(incidents)

# GET ONE
@app.route('/incidents/<incident_id>', methods=['GET'])
def get_incident(incident_id):
    for incident in incidents:
        if incident["incident_id"] == incident_id:
            return jsonify(incident)
    return jsonify({"message": "Incident Not Found"}), 404

# UPDATE
@app.route('/incidents/<incident_id>', methods=['PUT'])
def update_incident(incident_id):
    data = request.json
    for incident in incidents:
        if incident["incident_id"] == incident_id:
            incident.update(data)
            return jsonify({"message": "Updated", "data": incident})
    return jsonify({"message": "Incident Not Found"}), 404

# DELETE
@app.route('/incidents/<incident_id>', methods=['DELETE'])
def delete_incident(incident_id):
    global incidents
    incidents = [i for i in incidents if i["incident_id"] != incident_id]
    return jsonify({"message": "Deleted"})

if __name__ == "__main__":
    app.run(debug=True)