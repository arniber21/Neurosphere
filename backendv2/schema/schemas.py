def individual_person(person: NeurospherePerson) -> dict:
    return {
        "id": str(person["_id"]),
        "name": person["name"],
        "num_appointments": person["num_appointments"],
        "num_brain_tumors": person["num_brain_tumors"],
        "last_appointment": person["last_appointment"],
        "files": person["files"],
    }

def all_people(people: list) -> list:
    return [individual_person(person) for person in people]

