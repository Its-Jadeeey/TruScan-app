import getpass
from security import hash_password
print(hash_password(getpass.getpass("New admin password: ")))