import tiktoken
import sys

def main():
    input_string = sys.argv[1]
    encoding = tiktoken.encoding_for_model("gpt-35-turbo")
    print(len(encoding.encode(input_string)), end="")

if __name__ == "__main__":
    main()