import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@components/widgets';
import { colors, measures } from '@common/styles';
import TabBarIcon from './TabBarIcon';

export default class TabBar extends React.Component {

    renderTab = (tab, i) => (
        <TabBarIcon
            key={i}
            {...tab}
            active={this.props.active === i}
            onPress={() => this.props.onPressTabItem(tab.id)} />
    )

    render() {
        const { tabs } = this.props;
        return (
            <View style={styles.container}>
                {tabs.map(this.renderTab)}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'stretch',
        justifyContent: 'space-around',
        flexDirection: 'row',
        height: 60,
        borderTopWidth: 1,
        borderColor: colors.white,
        backgroundColor: colors.white,
        shadowOpacity: 1,
        shadowRadius: 20,
        shadowColor: colors.grey,
        shadowOffset: { height: 0, width: 0 },
    }
});