from tethys_sdk.base import TethysAppBase, url_map_maker


class Grace(TethysAppBase):
    """
    Tethys app class for Grace.
    """

    name = 'Grace'
    index = 'grace:home'
    icon = 'grace/images/logo.jpg'
    package = 'grace'
    root_url = 'grace'
    color = '#e74c3c'
    description = 'View Global Grace Data'
    tags = ''
    enable_feedback = False
    feedback_emails = []

        
    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (UrlMap(name='home',
                           url='grace',
                           controller='grace.controllers.home'),
                    UrlMap(name='global-map',
                           url='grace/global-map',
                           controller='grace.controllers.global_map'),
                    UrlMap(name='nepal-graph',
                           url='grace/nepal-graph',
                           controller='grace.controllers.nepal_graph'),
                    UrlMap(name='grace/plot',
                           url='grace/plot',
                           controller='grace.ajax_controllers.get_plot'),
                    UrlMap(name='grace/plot-global',
                           url='grace/plot-global',
                           controller='grace.ajax_controllers.get_plot_global'),
        )

        return url_maps