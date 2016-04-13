/* global App Marionette */

App.DepartementListView = Marionette.CompositeView.extend({
	template: 'entreprise.DepartementList',

	childView: App.DepartementItemView,
	emptyView: App.EmptyCollectionView,

	childViewContainer: 'tbody'
})
.mixin([App.ItemAddMixin], {
	entity: 'entrepriseDepartement'
})
.mixin([
	App.BaseViewMixin,
	App.PaginationMixin
]);
