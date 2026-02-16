import requests
import sys

def create_test_user(access_token, site_id='MCO'):
    """
    Creates a Mercado Pago test user.
    Site IDs: MCO (Colombia), MLA (Argentina), MLB (Brazil), MLM (Mexico), etc.
    """
    url = "https://api.mercadopago.com/users/test_user"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    payload = {
        "site_id": site_id
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        print("\n✅ Test User Created Successfully!")
        print(f"ID: {data.get('id')}")
        print(f"Nickname: {data.get('nickname')}")
        print(f"Password: {data.get('password')}")
        print(f"Email: {data.get('email')}")
        if data.get('test_access_token'):
            print(f"Test Access Token: {data.get('test_access_token')}")
        
        print("\n⚠️ Keep these credentials safe for your Sandbox testing.")
        
    except requests.exceptions.HTTPError as err:
        print(f"\n❌ Error: {err}")
        print(f"Details: {response.text}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python create_mp_test_user.py <YOUR_MAIN_ACCESS_TOKEN> [SITE_ID]")
        print("Default SITE_ID is MCO (Colombia)")
        sys.exit(1)
    
    token = sys.argv[1]
    site = sys.argv[2] if len(sys.argv) > 2 else 'MCO'
    create_test_user(token, site)
