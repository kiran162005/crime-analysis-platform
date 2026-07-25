users = [
    {
        "username": "admin",
        "password": "admin123",
        "role": "SCRB Admin",
        "district": "All"
    },
    {
        "username": "district1",
        "password": "district123",
        "role": "District Officer",
        "district": "Bangalore"
    },
    {
        "username": "investigator1",
        "password": "invest123",
        "role": "Investigator",
        "assigned_cases": ["INC001", "INC002"]
    }
]

def login_user(username, password):
    for user in users:
        if user["username"] == username and user["password"] == password:
            return user
    return None


def check_access(user, district=None, case_id=None):

    if user["role"] == "SCRB Admin":
        return True

    elif user["role"] == "District Officer":
        return district == user["district"]

    elif user["role"] == "Investigator":
        return case_id in user["assigned_cases"]

    return False