# passkeygen.py
import random as r

def pwd_gen():
    pwd = ""
    p = r.choice
    l_a = 'abcdefghijklmnopqrstuvwxyz'
    u_a = l_a.upper()
    num = [str(i) for i in range(10)]
    symb = "!@#$%^&*)(+_"
    
    # Generate a password of 10 characters (5 pairs of lowercase, uppercase, symbol, and number)
    while len(pwd) < 10:
        pwd += p(l_a) + p(u_a) + p(symb) + p(num)
    
    pwd_list = list(pwd)
    r.shuffle(pwd_list)
    pwd = ''.join(pwd_list[:10])
    
    return pwd

# Print the generated password to use it in Node.js
print(pwd_gen())
