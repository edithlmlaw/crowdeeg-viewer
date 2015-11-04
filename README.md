# crowdeeg-viewer

Developed as part of professor Edith Law's CrowdEEG project, this web application is designed for EEG/ECG annotation by unskilled workers. Two interfaces are included in this open source release. The expert interface, which can be used by neurologists to produce gold standard classifications, and the mechanical turk interface, which is designed to teach turkers how to identify sleep spindles. This example is shown to provide inspiration and examples for ways to build on top of the core crowdeeg-viewer.

At the moment the primary developer on this project is Josh Bradshaw (http://joshbradshaw.ca/) [Josh Bradshaw](https://github.com/JoshBradshaw). Please get in touch if with any issues or progress on the project.

## Expert Interface: 

![Expert Interface](http://i.imgur.com/Gkdjpj3.png)

## Mechanical Turk Interface

![Mechanical Turk Interface](http://i.imgur.com/BKKaq1g.png)

## Vagrant Setup

[Download Vagrant](https://www.vagrantup.com/downloads.html)

In the root directory run the following commands:

```
vagrant up
#this will take a while...

vagrant ssh

db_migrate

create_user

server
```

In your browser, visit http://localhost:8080.
