import sys

def check_balance(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    stack = []
    pairs = {'{': '}', '[': ']', '(': ')'}
    for i, char in enumerate(content):
        if char in pairs:
            stack.append((char, i))
        elif char in pairs.values():
            if not stack:
                print(f"Unexpected closing {char} at index {i}")
                return False
            opening, pos = stack.pop()
            if pairs[opening] != char:
                print(f"Mismatched {opening} at index {pos} and {char} at index {i}")
                return False
    
    if stack:
        for char, pos in stack:
            print(f"Unclosed {char} at index {pos}")
        return False
    
    print("Balanced!")
    return True

if __name__ == "__main__":
    check_balance(sys.argv[1])
