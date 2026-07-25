from flask import Flask, request, jsonify
from auth import login_user

app = Flask(__name__)

@app.route("/login", methods=["POST"])
def login():

    data = request.json

    user = login_user(
        data["username"],
        data["password"]
    )

    if user:
        return jsonify({
            "message": "Login Successful",
            "role": user["role"]
        })

    return jsonify({
        "message": "Invalid Credentials"
    }), 401


if __name__ == "__main__":
    app.run(debug=True)