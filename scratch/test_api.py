import requests
import json

def run_tests():
    base_url = "http://localhost:8000/api/v1/memories"
    
    # Clean up before testing (just in case)
    # Since we can't easily clean up without knowing IDs, we'll assume a clean DB or delete at the end.
    
    # 1. Create memory 1
    payload1 = {"message": "I just learned how to build FastAPI apps and connect them to SQLite."}
    print("Testing Memory 1 Creation...")
    resp = requests.post(base_url, json=payload1)
    assert resp.status_code == 201
    data1 = resp.json()
    id1 = data1["id"]
    
    # 2. Create memory 2
    payload2 = {"message": "Today I walked in the park and watched the ducks."}
    print("Testing Memory 2 Creation...")
    resp = requests.post(base_url, json=payload2)
    assert resp.status_code == 201
    data2 = resp.json()
    id2 = data2["id"]
    
    # 3. Get list of memories (no search)
    print("\nTesting List Memories...")
    resp = requests.get(base_url)
    assert resp.status_code == 200
    data = resp.json()
    print(f"Listed {data['total']} memories.")
    # Total should be at least 2
    assert data["total"] >= 2
    
    # 4. Search memories for "FastAPI"
    print("\nTesting Search Memories for 'FastAPI'...")
    resp = requests.get(f"{base_url}?search=FastAPI")
    assert resp.status_code == 200
    data = resp.json()
    print("Search results for 'FastAPI':")
    for i, item in enumerate(data["items"]):
        print(f"Rank {i+1}: {item['raw_input']}")
    # The first result should be the FastAPI memory
    assert "FastAPI" in data["items"][0]["raw_input"]
    
    # 5. Search memories for "ducks"
    print("\nTesting Search Memories for 'ducks'...")
    resp = requests.get(f"{base_url}?search=ducks")
    assert resp.status_code == 200
    data = resp.json()
    print("Search results for 'ducks':")
    for i, item in enumerate(data["items"]):
        print(f"Rank {i+1}: {item['raw_input']}")
    assert "ducks" in data["items"][0]["raw_input"]
    
    # 5.5. Search memories for unrelated nonsense
    print("\nTesting Search Memories for unrelated nonsense...")
    resp = requests.get(f"{base_url}?search=nuclear+reactor+details")
    assert resp.status_code == 200
    data = resp.json()
    print(f"Search results for unrelated nonsense count: {data['total']}")
    # This should be 0 because of the 450.0 distance threshold filter
    assert data["total"] == 0
    
    # 6. Delete both memories
    print("\nTesting Delete Memories...")
    resp = requests.delete(f"{base_url}/{id1}")
    assert resp.status_code == 204
    resp = requests.delete(f"{base_url}/{id2}")
    assert resp.status_code == 204
    print("Delete succeeded.")
    
    print("\nVerification complete: all tests passed!")

if __name__ == "__main__":
    run_tests()
