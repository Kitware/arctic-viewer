---
layout: default
---

<div class="home">

    <section class="intro">
        <div class="grid">
            <div class="unit whole center-on-mobiles">
                <p class="vision">{{ site.vision }}</p>
                <p class="description"> {{ site.description }}</p>
                <p class="details hide-on-mobiles"> {{ site.details }}</p>
            </div>
        </div>
    </section>
    <section class="feature">
        <div class='grid'>
            <div class='unit one-third'>
                <h2>Command line tool</h2>
                <p>
                    The ArcticView is a command line tool that can work anywhere
                    NodeJS or JavaScript is available and let you serve and or
                    explore large dataset in an intuitive manner.
                </p>
            </div>
            <div class='unit one-third'>
                <h2>Mobile Friendly</h2>
                <p>
                    Mobile clients can connect to an ArcticViewer server or
                    download the native iOS application on the Store. The later
                    wraps the JavaScript code of this project into a native Swift
                    application for a better mobile experience.
                </p>
            </div>
            <div class="unit one-third">
                <h2>Simple to use</h2>
                <p>
                    Serve a large dataset via a simple command line and use your
                    browser to control and navigate through it.
                </p>
            </div>
        </div>
    </section>
   <div class="grid">
        <div class="unit whole">

        <h2>Getting Started</h2>
        <p>{{ site.project }} can be retrieved using npm within your web project.</p>

{% highlight bash %}
$ npm install -g {{ site.project }}
$ mkdir ArcticData && cd $_
$ ArcticData --download-sample-data
$ ArcticData --data ./hydra-image-fluid-velocity
{% endhighlight %}

        <h2>Documentation</h2>
        <p>See the <a href="{{ site.baseurl }}">documentation</a> for a getting started guide, advanced documentation,
        and API descriptions.</p>

        <h2>Licensing</h2>
        <p>{{ site.title }} is licensed under {{ site.license }}
        <a href="https://github.com/{{ site.repository }}/blob/master/LICENSE">License</a>.</p>

        <h2>Getting Involved</h2>
        <p>Fork the {{ site.project }} repository and do great things. At <a href="{{ site.companyURL }}">
        {{ site.company }}</a>, we want to make {{ site.project }} useful to as many people as possible.

        </div>
    </div>
</div>

