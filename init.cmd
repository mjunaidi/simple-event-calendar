@echo off
git init
git add --all
git commit -m "first commit"
git remote add origin https://github.com/mjunaidi/simple-event-calendar.git
git push -u origin master
