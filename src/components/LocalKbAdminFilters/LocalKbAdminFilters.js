import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { isEmpty } from 'lodash';
import { Accordion, AccordionSet, FilterAccordionHeader, Selection } from '@folio/stripes/components';
import { CheckboxFilter } from '@folio/stripes/smart-components';

const FILTERS = [
  'runningStatus',
  'outcome',
];

export default class LocalKbAdminFilters extends React.Component {
  static propTypes = {
    activeFilters: PropTypes.object,
    data: PropTypes.object.isRequired,
    filterHandlers: PropTypes.object,
  };

  static defaultProps = {
    activeFilters: {
      runningStatus: [],
      outcome: [],
    }
  };

  state = {
    runningStatus: [],
    outcome: [],
  }

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    FILTERS.forEach(filter => {
      console.log(props.data,'props');
      const values = props.data[`${filter}Values`];
      if (values.length !== state[filter].length) {
        newState[filter] = values.map(({ label }) => ({ label, value: label }));
      }
    });

    if (Object.keys(newState).length) return newState;

    return null;
  }

  renderCheckboxFilter = (name, props) => {
    const { activeFilters } = this.props;
    const groupFilters = activeFilters[name] || [];
    console.log(this.state, name, 'state');
    return (
      <Accordion
        id={`filter-accordion-${name}`}
        displayClearButton={groupFilters.length > 0}
        header={FilterAccordionHeader}
        label={<FormattedMessage id={`ui-local-kb-admin.prop.${name}`} />}
        onClearFilter={() => { this.props.filterHandlers.clearGroup(name); }}
        separator={false}
        {...props}
      >
        <CheckboxFilter
          dataOptions={this.state[name]}
          name={name}
          onChange={(group) => { this.props.filterHandlers.state({ ...activeFilters, [group.name]: group.values }); }}
          selectedValues={groupFilters}
        />
      </Accordion>
    );
  }

  render() {
    return (
      <AccordionSet>
        {this.renderCheckboxFilter('runningStatus')}
        {this.renderCheckboxFilter('outcome')}
      </AccordionSet>
    );
  }
}
