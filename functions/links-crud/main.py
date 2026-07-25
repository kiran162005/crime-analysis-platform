from flask import Flask, request, jsonify

app = Flask(__name__)

links = []

@app.route('/links', methods=['POST'])
def create_link():
    data = request.json
    links.append(data)
    return jsonify({"message": "Link Created", "data": data})

@app.route('/links', methods=['GET'])
def get_all_links():
    return jsonify(links)

@app.route('/links/<link_id>', methods=['GET'])
def get_link(link_id):
    for link in links:
        if link["link_id"] == link_id:
            return jsonify(link)
    return jsonify({"message": "Link Not Found"}), 404

@app.route('/links/<link_id>', methods=['PUT'])
def update_link(link_id):
    data = request.json
    for link in links:
        if link["link_id"] == link_id:
            link.update(data)
            return jsonify({"message": "Updated", "data": link})
    return jsonify({"message": "Link Not Found"}), 404

@app.route('/links/<link_id>', methods=['DELETE'])
def delete_link(link_id):
    global links
    links = [l for l in links if l["link_id"] != link_id]
    return jsonify({"message": "Deleted"})

if __name__ == "__main__":
    app.run(debug=True)