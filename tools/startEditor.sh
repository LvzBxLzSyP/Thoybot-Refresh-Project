#!/bin/bash

# Check the EDITOR or VISUAL environment variables first
if [ -n "$EDITOR" ]; then
    default_editor="$EDITOR"
elif [ -n "$VISUAL" ]; then
    default_editor="$VISUAL"
else
    # If neither is set, check for common editors
    if command -v vim &> /dev/null; then
        default_editor="vim"
    elif command -v nano &> /dev/null; then
        default_editor="nano"
    elif command -v emacs &> /dev/null; then
        default_editor="emacs"
    elif command -v code &> /dev/null; then
        default_editor="code"
    else
        # If no suitable editor is found, display an error message
        echo "No text editor found. Please install vim, nano, emacs, or code." >&2
        exit 1
    fi
fi

$default_editor configs/config.json