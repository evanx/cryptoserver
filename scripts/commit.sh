

message="scripts"
if [ $# -gt 0 ]
then
  message="$*"
fi

  git add -A 
  git commit -m "$message"
  git push
